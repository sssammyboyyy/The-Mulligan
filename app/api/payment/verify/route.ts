import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendBookingConfirmation } from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.redirect(new URL("/booking?error=no_reference", request.url))
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status || paystackData.data.status !== "success") {
      console.error("[v0] Payment verification failed:", paystackData)
      return NextResponse.redirect(new URL("/booking?error=payment_failed", request.url))
    }

    // Update booking status
    const supabase = await createClient()
    const { data: booking, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "completed",
      })
      .eq("id", reference)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Booking update error:", updateError)
    }

    if (booking) {
      await sendBookingConfirmation({
        to: booking.guest_email,
        bookingId: booking.id,
        guestName: booking.guest_name,
        bookingDate: booking.booking_date,
        startTime: booking.start_time,
        duration: booking.duration_hours,
        playerCount: booking.player_count,
        totalPrice: booking.total_price,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/booking/manage/${booking.id}`,
      })
    }

    // Redirect to success page
    return NextResponse.redirect(new URL(`/booking/success?reference=${reference}`, request.url))
  } catch (error) {
    console.error("[v0] Payment verification error:", error)
    return NextResponse.redirect(new URL("/booking?error=verification_failed", request.url))
  }
}
