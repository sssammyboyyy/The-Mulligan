import { NextResponse, NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/client"
import { getOperatingHours, isClosedDay } from "@/lib/schedule-config"
import { createSASTTimestamp, addHoursToSAST } from "@/lib/utils"
import { sendStoreReceiptEmail, sendGuestConfirmationEmail } from "@/lib/mail"

function calculateEndTimeText(start: string, duration: number): string {
  const [hours, minutes] = start.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  date.setHours(date.getHours() + duration)
  return date.toTimeString().slice(0, 5)
}

function parsePgDate(pgDateStr: string): number {
  if (!pgDateStr) return 0;
  let safeStr = pgDateStr.replace(' ', 'T');
  if (/([+-]\d{2})$/.test(safeStr)) safeStr += ':00';
  const ms = new Date(safeStr).getTime();
  return isNaN(ms) ? 0 : ms;
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const bookingData = await request.json()

    const {
      booking_date,
      start_time,
      duration_hours,
      total_price,
      guest_name,
      guest_email,
      guest_phone,
      payment_status,
      booking_source
    } = bookingData

    // 1. VALIDATE INPUTS
    if (!booking_date || !start_time || !duration_hours) {
      return NextResponse.json({ error: "Missing required booking fields." }, { status: 400 })
    }

    if (isClosedDay(booking_date)) {
      return NextResponse.json({ error: "Venue closed on this date." }, { status: 400 })
    }

    const operatingHours = getOperatingHours(new Date(booking_date))
    if (!operatingHours) {
      return NextResponse.json({ error: "Venue closed on this date." }, { status: 400 })
    }

    // 2. SANITY CHECK DATE STRINGS
    const slotStartISO = createSASTTimestamp(booking_date, start_time)
    const slotEndISO = addHoursToSAST(slotStartISO, duration_hours)
    
    if (!slotStartISO || !slotEndISO || isNaN(new Date(slotStartISO).getTime())) {
      return NextResponse.json({ error: "Invalid date or time calculation." }, { status: 400 })
    }

    const reqStartMs = new Date(slotStartISO).getTime()
    const reqEndMs = new Date(slotEndISO).getTime()

    // 3. UNIVERSAL BAY AUTO-ALLOCATION (The Resource Guard)
    const { data: overlaps, error: overlapError } = await supabase
      .from("bookings")
      .select("simulator_id, slot_start, slot_end")
      .eq("booking_date", booking_date)
      .neq("status", "cancelled")

    if (overlapError) throw overlapError;

    const occupiedBays = new Set<number>()
    if (overlaps) {
      overlaps.forEach((b) => {
        const bStart = parsePgDate(b.slot_start)
        const bEnd = parsePgDate(b.slot_end)
        if (bStart < reqEndMs && bEnd > reqStartMs) {
          occupiedBays.add(b.simulator_id)
        }
      })
    }

    const assignedSimulatorId = [1, 2, 3].find(id => !occupiedBays.has(id));

    if (!assignedSimulatorId) {
      return NextResponse.json(
        { error: "Conflict: All 3 Simulators are busy for this time slot." },
        { status: 409 }
      )
    }

    // 4. INSERT BOOKING
    const status = booking_source === "walk_in" ? "confirmed" : (payment_status === "completed" ? "confirmed" : "pending")
    const payStatus = payment_status === "completed" ? "paid_instore" : "pending"

    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        booking_date,
        start_time,
        end_time: calculateEndTimeText(start_time, duration_hours),
        slot_start: slotStartISO,
        slot_end: slotEndISO,
        duration_hours,
        simulator_id: assignedSimulatorId,
        user_type: "walk_in",
        guest_name: guest_name || "Walk-In Guest",
        guest_email,
        guest_phone,
        total_price,
        status,
        payment_status: payStatus,
        booking_source: booking_source || "walk_in",
        player_count: bookingData.players || 1,
        session_type: bookingData.session_type || "quick",
        addon_water_qty: bookingData.addon_water_qty || 0,
        addon_gloves_qty: bookingData.addon_gloves_qty || 0,
        addon_balls_qty: bookingData.addon_balls_qty || 0,
        addon_club_rental: bookingData.addon_club_rental || false,
        addon_coaching: bookingData.addon_coaching || false,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Insert Error:", insertError)
      return NextResponse.json({ error: "Failed to create booking", details: insertError.message }, { status: 500 })
    }

    // 5. DUAL EMAIL DISPATCH (Concurrent)
    const emailProps = {
      guest_email,
      guest_name: guest_name || "Golfer",
      booking_date,
      start_time,
      duration_hours,
      player_count: bookingData.players || 1,
      simulator_id: assignedSimulatorId,
      total_price,
      amount_paid: payStatus === "paid_instore" ? total_price : 0,
      addon_club_rental: bookingData.addon_club_rental,
      addon_coaching: bookingData.addon_coaching,
      addon_water_qty: bookingData.addon_water_qty,
      addon_gloves_qty: bookingData.addon_gloves_qty,
      addon_balls_qty: bookingData.addon_balls_qty,
    };

    // Firing concurrent to avoid sequential network bottleneck
    await Promise.allSettled([
      sendStoreReceiptEmail(emailProps),
      sendGuestConfirmationEmail(emailProps)
    ]);

    return NextResponse.json({ success: true, booking_id: booking.id, assigned_bay: assignedSimulatorId })

  } catch (error: any) {
    console.error("Booking Engine Server Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
