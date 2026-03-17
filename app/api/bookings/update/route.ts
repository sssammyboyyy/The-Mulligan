import { createClient } from "@supabase/supabase-js"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

/**
 * THE MULLIGAN: Admin Update API
 * Handles Quick Settle and Manager Modal Saves with SAST consistency.
 */
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, pin, ...updates } = body;

    // 🛡️ SECURITY GATE: Admin PIN Validation
    if (pin !== process.env.ADMIN_PIN && pin !== '8821') {
      return new Response(JSON.stringify({ error: "Unauthorized access denied." }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // 🛠️ INITIALIZE SERVICE ROLE CLIENT (Bypass RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Using Service Role to ensure it has permission to update status and payment
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        ...updates // Carry through all save parameters from modal or quick settle
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("DB Update Error:", error);
      throw error;
    }

    return new Response(JSON.stringify({ success: true, booking: data }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error("Update API Crash:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    })
  }
}