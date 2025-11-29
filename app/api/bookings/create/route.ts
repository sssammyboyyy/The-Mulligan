import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// 1. Force Edge Runtime
export const runtime = "edge"

// --- HELPERS (Same as Checkout Route for consistency) ---
function createSASTTimestamp(dateStr: string, timeStr: string): string {
  const cleanTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr
  return `${dateStr}T${cleanTime}+02:00`
}

function addHoursToTimestamp(timestamp: string, hours: number): string {
  const date = new Date(timestamp)
  date.setHours(date.getHours() + hours)
  return date.toISOString()
}

function calculateEndTimeText(start: string, duration: number): string {
  const [hours, minutes] = start.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  date.setHours(date.getHours() + duration)
  return date.toTimeString().slice(0, 5)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const bookingData = await request.json()

    // 1. EXTRACT DATA
    const {
      booking_date,
      start_time,
      duration_hours,
      total_price,
      guest_name,
      guest_email,
      guest_phone,
      payment_status, // e.g. "completed" for cash/card in store
    } = bookingData

    // 2. CALCULATE TIMES
    const slotStartISO = createSASTTimestamp(booking_date, start_time)
    const slotEndISO = addHoursToTimestamp(slotStartISO, duration_hours)
    const endTimeText = calculateEndTimeText(start_time, duration_hours)

    // 3. CHECK AVAILABILITY (MULTI-BAY LOGIC)
    
    // Fetch all active bookings for this day
    const { data: dailyBookings } = await supabase
      .from("bookings")
      .select("simulator_id, slot_start, slot_end")
      .eq("booking_date", booking_date)
      .neq("status", "cancelled")

    // Identify which bays are taken
    const takenBays = new Set<number>()
    
    if (dailyBookings) {
      dailyBookings.forEach((b) => {
        // Overlap Logic: (StartA < EndB) and (EndA > StartB)
        const isOverlapping = b.slot_start < slotEndISO && b.slot_end > slotStartISO
        if (isOverlapping) {
          takenBays.add(b.simulator_id)
        }
      })
    }

    // 4. ASSIGN BAY (1 -> 2 -> 3)
    let assignedSimulatorId = 0
    if (!takenBays.has(1)) assignedSimulatorId = 1
    else if (!takenBays.has(2)) assignedSimulatorId = 2
    else if (!takenBays.has(3)) assignedSimulatorId = 3

    // If all are full, return 409
    if (assignedSimulatorId === 0) {
      return NextResponse.json(
        { error: "All 3 Simulators are busy for this time slot." }, 
        { status: 409 }
      )
    }

    // 5. INSERT BOOKING
    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        booking_date,
        start_time,
        end_time: endTimeText,
        slot_start: slotStartISO,
        slot_end: slotEndISO,
        duration_hours,
        simulator_id: assignedSimulatorId, // <--- Assigned Dynamically
        user_type: "walk_in", // Track that this was an admin/walk-in
        guest_name: guest_name || "Walk-In Guest",
        guest_email,
        guest_phone,
        total_price,
        // If admin says "completed", mark as confirmed & paid_instore
        status: payment_status === "completed" ? "confirmed" : "pending",
        payment_status: payment_status === "completed" ? "paid_instore" : "pending",
        // Default fields
        players: bookingData.players || 1,
        session_type: bookingData.session_type || "quick",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("Walk-in Insert Error:", insertError)
      // CHANGE THIS LINE to send the full error details to the frontend
      return NextResponse.json({ 
        error: insertError.message, 
        details: insertError 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, booking_id: booking.id, assigned_bay: assignedSimulatorId })

  } catch (error: any) {
    console.error("Walk-in Server Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
