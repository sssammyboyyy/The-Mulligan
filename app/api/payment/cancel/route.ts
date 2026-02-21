import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { reference } = body

        if (!reference) {
            return NextResponse.json({ error: "Missing reference" }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Verify it's still pending before cancelling
        const { data: booking, error: fetchError } = await supabase
            .from("bookings")
            .select("status, payment_status")
            .eq("id", reference)
            .single()

        if (fetchError || !booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 })
        }

        if (booking.status === "cancelled" || booking.payment_status === "completed") {
            // Already handled
            return NextResponse.json({ success: true, message: "Booking already processed" })
        }

        // Hard delete or mark cancelled (we'll mark cancelled so we have a record, but free the slot)
        const { error: updateError } = await supabase
            .from("bookings")
            .update({
                status: "cancelled",
                payment_status: "cancelled",
                guest_name: "Abandoned Checkout"
            })
            .eq("id", reference)

        if (updateError) {
            throw new Error(updateError.message)
        }

        return NextResponse.json({ success: true, message: "Abandoned booking cleared." })

    } catch (error: any) {
        console.error("Cancel Webhook Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
