import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const reference = searchParams.get("reference") // This is the booking_id

  // 1. Basic Validation
  if (!reference) {
    return NextResponse.redirect(new URL("/booking?error=no_payment_reference", request.url))
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 2. Check the Booking in DB
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, status, payment_status, yoco_payment_id, amount_paid, total_price")
      .eq("id", reference)
      .single()

    if (error || !booking) {
      console.error("Verify Error:", error)
      return NextResponse.redirect(new URL("/booking?error=booking_not_found", request.url))
    }

    // 3. LEGACY SYNC (Removed in v4 in favor of Webhook-Only + Polling)
    // We now rely on the Yoco Webhook triggering trigger-n8n.
    // The success page polls /api/booking-status for the result.

    // 4. Smart Redirect
    // They are sent to success page, where the frontend will also pull the latest DB state.
    return NextResponse.redirect(new URL(`/booking/success?reference=${reference}`, request.url))

  } catch (error) {
    console.error("Verify Exception:", error)
    return NextResponse.redirect(new URL(`/booking/success?reference=${reference}`, request.url))
  }
}
