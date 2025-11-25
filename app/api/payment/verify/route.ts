import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const reference = searchParams.get("reference")

    console.log("[v0] Payment verification started for reference:", reference)

    if (!reference) {
      return NextResponse.redirect(new URL("/booking?error=no_reference", request.url))
    }

    // Get booking to retrieve payment reference
    const supabase = await createClient()
    const { data: booking } = await supabase.from("bookings").select("*").eq("id", reference).single()

    if (!booking?.payment_reference) {
      console.error("[v0] No payment reference found for booking:", reference)
      return NextResponse.redirect(new URL("/booking?error=no_payment_reference", request.url))
    }

    console.log("[v0] Verifying Yoco payment:", booking.payment_reference)

    const yocoResponse = await fetch(`https://payments.yoco.com/api/checkouts/${booking.payment_reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
      },
    })

    const yocoData = await yocoResponse.json()

    if (!yocoResponse.ok || yocoData.status !== "successful") {
      console.error("[v0] Payment verification failed:", yocoData)
      return NextResponse.redirect(new URL("/booking?error=payment_failed", request.url))
    }

    console.log("[v0] Payment successful, updating booking status")

    // Update booking status
    const { data: updatedBooking, error: updateError } = await supabase
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

    if (updatedBooking) {
      const webhookUrl = process.env.N8N_WEBHOOK_URL
      if (webhookUrl) {
        const webhookPayload = {
          event: "payment_completed",
          booking_id: updatedBooking.id,
          guest_name: updatedBooking.guest_name,
          guest_email: updatedBooking.guest_email,
          guest_phone: updatedBooking.guest_phone,
          booking_date: updatedBooking.booking_date,
          start_time: updatedBooking.start_time,
          duration_hours: updatedBooking.duration_hours,
          player_count: updatedBooking.player_count,
          session_type: updatedBooking.session_type,
          famous_course_option: updatedBooking.famous_course_option,
          total_price: updatedBooking.total_price,
          payment_reference: updatedBooking.payment_reference,
          accept_whatsapp: updatedBooking.accept_whatsapp,
          enter_competition: updatedBooking.enter_competition,
          confirmed_at: new Date().toISOString(),
        }

        console.log("[v0] Sending payment confirmation webhook to n8n")

        try {
          const webhookResponse = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(webhookPayload),
          })

          if (webhookResponse.ok) {
            console.log("[v0] Payment confirmation webhook sent successfully")
          } else {
            console.error("[v0] Payment confirmation webhook failed:", await webhookResponse.text())
          }
        } catch (webhookError) {
          console.error("[v0] Payment confirmation webhook error:", webhookError)
        }
      }
    }

    // Redirect to success page
    return NextResponse.redirect(new URL(`/booking/success?reference=${reference}`, request.url))
  } catch (error) {
    console.error("[v0] Payment verification error:", error)
    return NextResponse.redirect(new URL("/booking?error=verification_failed", request.url))
  }
}
