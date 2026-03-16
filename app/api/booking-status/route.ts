import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
        return Response.json({ error: "Missing Booking ID" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: booking, error } = await supabase
        .from("booking_dashboard")
        .select("status, payment_status, payment_state, email_sent, email_sent_at")
        .eq("id", id)
        .single()

    if (error || !booking) {
        return Response.json({ error: "Booking not found" }, { status: 404 })
    }

    return Response.json(booking)
}
