import { createClient } from "@supabase/supabase-js"
import { createSASTTimestamp, addHoursToSAST } from "@/lib/utils"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.json()
    
    // Data Sanitization
    const players = Math.min(Math.max(Number(body.player_count || 1), 1), 4);
    const duration = Number(body.duration_hours || 1);
    const startTime = body.start_time || '12:00';
    const simulatorId = Number(body.simulator_id || 1);

    // 🕒 SAST Slot Calculation (Critical for EXCLUDE USING gist)
    const slotStart = createSASTTimestamp(body.booking_date, startTime);
    const slotEnd = addHoursToSAST(slotStart, duration);

    // Pricing Math with Manager Overrides
    const rates = { 1: 250, 2: 360, 3: 480, 4: 600 };
    const baseTotal = (rates[players as keyof typeof rates] || 250) * duration;
    
    const clubs = body.addon_club_rental ? (100 * duration) : 0;
    const coaching = body.addon_coaching ? 250 : 0;
    
    // Manager persistence logic: qty * (override_price ?? standard_price)
    const water = (body.addon_water_qty || 0) * (body.addon_water_price ?? 20);
    const gloves = (body.addon_gloves_qty || 0) * (body.addon_gloves_price ?? 220);
    const balls = (body.addon_balls_qty || 0) * (body.addon_balls_price ?? 50);

    const calculatedTotal = baseTotal + clubs + coaching + water + gloves + balls;

    // 🎯 MANUAL PRICE OVERRIDE: If manager sent total_price, use it. Otherwise use calculated.
    const finalTotal = (body.total_price !== undefined && body.total_price !== null)
      ? Number(body.total_price)
      : calculatedTotal;

    const finalPayload = {
      guest_name: body.guest_name || 'Walk-in Guest',
      guest_phone: body.guest_phone || '0000000000',
      guest_email: body.guest_email || 'walkin@venue-os.com',
      simulator_id: simulatorId, 
      booking_date: body.booking_date,
      start_time: startTime,
      slot_start: slotStart,
      slot_end: slotEnd,
      duration_hours: duration,
      player_count: players,
      total_price: finalTotal,
      notes: body.notes || "",
      payment_type: body.payment_type || 'cash', 
      payment_status: body.payment_status || 'paid_instore',
      status: body.status || 'confirmed',
      booking_source: 'walk_in',
      user_type: 'walk_in',
      // Persist the specific prices typed by the manager
      addon_water_qty: Number(body.addon_water_qty || 0),
      addon_water_price: Number(body.addon_water_price ?? 20),
      addon_gloves_qty: Number(body.addon_gloves_qty || 0),
      addon_gloves_price: Number(body.addon_gloves_price ?? 220),
      addon_balls_qty: Number(body.addon_balls_qty || 0),
      addon_balls_price: Number(body.addon_balls_price ?? 50),
      addon_club_rental: Boolean(body.addon_club_rental),
      addon_coaching: Boolean(body.addon_coaching)
    }

    // 🛡️ ATOMIC INSERT with 23P01 Collision Recovery
    let data: any = null;
    try {
      const { data: insertData, error } = await supabaseAdmin
        .from("bookings")
        .insert([finalPayload])
        .select().single()

      if (error) throw error;
      data = insertData;
    } catch (insertError: any) {
      // 23P01 = EXCLUSION_VIOLATION — Mulligan Protocol: purge → wait 200ms → retry → 409
      if (insertError.code === '23P01' || insertError.message?.includes('exclusion constraint')) {
        console.warn(`[23P01] Admin-create race on Bay ${simulatorId}. Purging ghosts...`);

        // Step 1: Purge non-confirmed rows for this bay on this date
        await supabaseAdmin
          .from("bookings")
          .delete()
          .eq("booking_date", body.booking_date)
          .eq("simulator_id", simulatorId)
          .neq("status", "confirmed")

        // Step 2: Wait 200ms
        await new Promise(resolve => setTimeout(resolve, 200));

        // Step 3: Retry once
        const { data: retryData, error: retryError } = await supabaseAdmin
          .from("bookings")
          .insert([finalPayload])
          .select().single()

        if (retryData && !retryError) {
          console.log(`[23P01] Admin retry SUCCESS for Bay ${simulatorId}`);
          data = retryData;
        } else {
          // Step 4: Final failure — clean 409
          return new Response(JSON.stringify({
            error: "409 Conflict: This Bay is already booked for this specific time slot.",
            error_code: "SLOT_RACE_CONDITION"
          }), {
            status: 409, headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          })
        }
      } else {
        throw insertError;
      }
    }

    // 🎯 n8n WEBHOOK FOR CONFIRMED WALK-INS
    if (data && data.status === 'confirmed' && process.env.N8N_WEBHOOK_URL) {
      try {
        await fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: data.id,
            secret: process.env.N8N_WEBHOOK_SECRET || process.env.ADMIN_PIN
          })
        });
      } catch (err) {
        console.error("n8n Trigger Failed:", err);
      }
    }

    return new Response(JSON.stringify({ success: true, booking: data }), {
      status: 201, headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    })
  } catch (err: any) {
    console.error("[ADMIN-CREATE-ERROR]", err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    })
  }
}
