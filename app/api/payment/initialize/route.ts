import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      booking_date,
      start_time,
      duration_hours,
      player_count,
      session_type,
      famous_course_option,
      base_price,
      total_price,
      guest_name,
      guest_email,
      guest_phone,
      accept_whatsapp,
      enter_competition,
      coupon_code,
    } = body

    console.log("[v0] Creating booking with data:", { booking_date, start_time, guest_name, session_type })

    // Create booking in database
    const supabase = await createClient()

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        booking_date,
        start_time,
        end_time: calculateEndTime(start_time, duration_hours),
        duration_hours,
        player_count,
        user_type: "adult",
        session_type,
        famous_course_option,
        base_price,
        total_price,
        status: total_price === 0 ? "confirmed" : "pending",
        payment_status: total_price === 0 ? "completed" : "pending",
        guest_name,
        guest_email,
        guest_phone,
        accept_whatsapp,
        enter_competition,
        coupon_code,
      })
      .select()
      .single()

    if (bookingError) {
      console.error("[v0] Booking creation error:", bookingError)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    console.log("[v0] Booking created successfully:", booking.id)

    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (webhookUrl) {
      const webhookPayload = {
        event: "booking_created",
        booking_id: booking.id,
        guest_name,
        guest_email,
        guest_phone,
        booking_date,
        start_time,
        duration_hours,
        player_count,
        session_type,
        famous_course_option,
        base_price,
        total_price,
        payment_status: total_price === 0 ? "completed" : "pending",
        accept_whatsapp,
        enter_competition,
        coupon_code,
        created_at: new Date().toISOString(),
      }

      console.log("[v0] Sending webhook to n8n:", webhookUrl)

      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        })

        if (webhookResponse.ok) {
          console.log("[v0] n8n webhook sent successfully")
        } else {
          console.error("[v0] n8n webhook failed:", await webhookResponse.text())
        }
      } catch (webhookError) {
        console.error("[v0] n8n webhook error:", webhookError)
      }
    } else {
      console.log("[v0] N8N_WEBHOOK_URL not configured, skipping webhook")
    }

    // If total is 0 (100% coupon discount), return free booking confirmation
    if (total_price === 0) {
      return NextResponse.json({
        free_booking: true,
        booking_id: booking.id,
        message: "Booking confirmed with coupon",
      })
    }

    const getDepositAmount = () => {
      if (session_type === "famous-course") {
        if (famous_course_option === "4-ball") return 400
        if (famous_course_option === "3-ball") return 300
      }
      return total_price
    }

    const depositAmount = getDepositAmount()

    console.log("[v0] Initializing Yoco payment for R", depositAmount)

    // Normal payment flow with Yoco (deposit for famous courses)
    const yocoResponse = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(depositAmount * 100), // Yoco expects amount in cents
        currency: "ZAR",
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://themulligan.co.za"}/booking?cancelled=true`,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://themulligan.co.za"}/api/payment/verify?reference=${booking.id}`,
        failureUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://themulligan.co.za"}/booking?error=payment_failed`,
        metadata: {
          bookingId: booking.id,
          guestName: guest_name,
          guestPhone: guest_phone,
          bookingDate: booking_date,
          startTime: start_time,
          playerCount: player_count.toString(),
          sessionType: session_type,
          depositAmount: depositAmount.toString(),
          totalAmount: total_price.toString(),
        },
      }),
    })

    const yocoData = await yocoResponse.json()

    if (!yocoResponse.ok || !yocoData.redirectUrl) {
      console.error("[v0] Yoco initialization error:", yocoData)
      return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
    }

    console.log("[v0] Yoco payment initialized:", yocoData.id)

    // Update booking with payment reference
    await supabase.from("bookings").update({ payment_reference: yocoData.id }).eq("id", booking.id)

    return NextResponse.json({
      authorization_url: yocoData.redirectUrl,
      checkout_id: yocoData.id,
      reference: booking.id,
    })
  } catch (error) {
    console.error("[v0] Payment initialization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateEndTime(startTime: string, durationHours: number): string {
  const [hours, minutes] = startTime.split(":").map(Number)
  const totalMinutes = hours * 60 + minutes + durationHours * 60
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}:00`
}
