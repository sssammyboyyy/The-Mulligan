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

    console.log("[v0] Creating booking with data:", { booking_date, start_time, guest_name, session_type, coupon_code })

    const supabase = await createClient()

    // --- LOGIC: VALIDATE COUPON SERVER-SIDE ---
    let finalPrice = total_price;

    if (coupon_code) {
      const { data: couponData } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", coupon_code)
        .eq("is_active", true)
        .single();

      // Check if coupon exists and gives 100% discount
      if (couponData && couponData.discount_percent === 100) {
        console.log(`[v0] Valid Admin Coupon applied: ${coupon_code}. Setting price to 0.`);
        finalPrice = 0;
      }
    }
    // ---------------------------------------------

    // Determine Status based on our verified Final Price
    const initialStatus = finalPrice === 0 ? "confirmed" : "pending";
    const initialPaymentStatus = finalPrice === 0 ? "completed" : "pending";

    // Create booking in database
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        booking_date,
        start_time,
        end_time: calculateEndTime(start_time, duration_hours),
        duration_hours,
        player_count,
        user_type: "guest", // Defaulting to guest as confirmed earlier
        session_type,
        famous_course_option,
        base_price,
        total_price: finalPrice, // Use the verified price
        status: initialStatus,
        payment_status: initialPaymentStatus,
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

    // --- WEBHOOK LOGIC ---
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
        total_price: finalPrice,
        payment_status: initialPaymentStatus,
        accept_whatsapp,
        enter_competition,
        coupon_code,
        created_at: new Date().toISOString(),
      }

      // Fire and forget webhook
      try {
         fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        }).catch(err => console.error("Webhook failed", err));
      } catch (webhookError) {
        console.error("[v0] n8n webhook error:", webhookError)
      }
    }

    // --- CHECKOUT LOGIC ---

    // If verified total is 0 (100% coupon discount), return free booking confirmation immediately
    if (finalPrice === 0) {
      return NextResponse.json({
        free_booking: true,
        booking_id: booking.id,
        message: "Booking confirmed with coupon",
      })
    }

    // Determine Deposit Amount for Yoco
    const getDepositAmount = () => {
      if (session_type === "famous-course") {
        if (famous_course_option === "4-ball") return 400
        if (famous_course_option === "3-ball") return 300
      }
      return finalPrice
    }

    const depositAmount = getDepositAmount()
    console.log("[v0] Initializing Yoco payment for R", depositAmount)

    // Normal payment flow with Yoco
    const yocoResponse = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(depositAmount * 100), // Yoco expects cents
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
          playerCount: player_count?.toString() || "0",
          sessionType: session_type,
          depositAmount: depositAmount.toString(),
          totalAmount: finalPrice.toString(),
        },
      }),
    })

    const yocoData = await yocoResponse.json()

    if (!yocoResponse.ok || !yocoData.redirectUrl) {
      console.error("[v0] Yoco initialization error:", yocoData)
      return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
    }

    // Update booking with Yoco ID (using correct column name 'yoco_payment_id')
    await supabase
      .from("bookings")
      .update({ yoco_payment_id: yocoData.id })
      .eq("id", booking.id)

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
  if (!startTime) return "";
  const [hours, minutes] = startTime.split(":").map(Number)
  const totalMinutes = hours * 60 + minutes + durationHours * 60
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}:00`
}
