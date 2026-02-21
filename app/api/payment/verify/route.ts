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

    // 3. AGGRESSIVE SYNC: If Yoco ID exists but amount_paid is 0, they just returned from checkout
    // We must manually trigger the verification here on the server side to guarantee state.
    if (booking.yoco_payment_id && Number(booking.amount_paid) === 0) {

      // Let our own robust n8n trigger route handle the Yoco check and DB update
      const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.themulligan.org";
      try {
        await fetch(`${appUrl}/api/trigger-n8n`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: booking.id })
        });
        console.log(`[Verify Route] Automatically synced payment via trigger-n8n for ${booking.id}`);
      } catch (syncError) {
        console.error("[Verify Route] Aggressive sync failed:", syncError);
      }
    }

    // 4. Smart Redirect
    // They are sent to success page, where the frontend will also pull the latest DB state.
    return NextResponse.redirect(new URL(`/booking/success?reference=${reference}`, request.url))

  } catch (error) {
    console.error("Verify Exception:", error)
    return NextResponse.redirect(new URL(`/booking/success?reference=${reference}`, request.url))
  }
}
