import { createClient } from "@supabase/supabase-js"
import { createSASTTimestamp, addHoursToSAST } from "@/lib/utils"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// FIX: Removed runtime = 'edge' to satisfy OpenNext bundling rules
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

/**
 * Admin Walk-In Creation Route
 * Uses Service Role to bypass RLS and maps 'walk_in' to 'cash' for DB constraints.
 */
export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const body = await req.json()
    const { 
      full_name, 
      phone, 
      email, 
      bay_id, 
      booking_date,
      start_time, 
      duration_hours, 
      players, 
      amount_total,
      status 
    } = body

    // Timestamp Normalization (SAST)
    const slot_start = createSASTTimestamp(booking_date, start_time)
    const slot_end = addHoursToSAST(slot_start, Number(duration_hours))

    const finalPayload = {
      full_name,
      phone,
      email: email || null,
      bay_id,
      booking_date,
      start_time,
      slot_start,
      slot_end,
      duration_hours: Number(duration_hours),
      players: Number(players),
      total_price: amount_total || 0,
      status: (status || 'confirmed').toLowerCase(),
      payment_status: 'paid',
      payment_type: 'cash', // Standardized for DB Check Constraint
      booking_source: 'walk_in',
      user_type: 'guest'
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert([finalPayload])
      .select()
      .single()

    if (error) {
      console.error("[ADMIN-CREATE-DB-ERROR]", error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ success: true, booking: data }), {
      status: 201,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })

  } catch (error: any) {
    console.error("[ADMIN-CREATE-FATAL]", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }
}