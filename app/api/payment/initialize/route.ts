import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      booking_date,
      start_time,
      duration_hours,
      player_count,
      user_type,
      base_price,
      total_price,
      guest_name,
      guest_email,
      guest_phone,
      upsells,
      enter_competition,
    } = body

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
        user_type,
        base_price,
        total_price,
        status: "pending",
        payment_status: "pending",
        guest_name,
        guest_email,
        guest_phone,
      })
      .select()
      .single()

    if (bookingError) {
      console.error("[v0] Booking creation error:", bookingError)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    // Add upsells if any
    if (upsells && upsells.length > 0) {
      const upsellInserts = upsells.map((upsell: any) => ({
        booking_id: booking.id,
        upsell_id: upsell.id,
        quantity: 1,
        price: upsell.price,
      }))

      await supabase.from("booking_upsells").insert(upsellInserts)
    }

    // Initialize Paystack payment
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: guest_email,
        amount: Math.round(total_price * 100), // Paystack expects amount in kobo (cents)
        reference: booking.id,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payment/verify`,
        metadata: {
          booking_id: booking.id,
          guest_name,
          guest_phone,
          booking_date,
          start_time,
          player_count,
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      console.error("[v0] Paystack initialization error:", paystackData)
      return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
    }

    // Update booking with payment reference
    await supabase.from("bookings").update({ payment_reference: booking.id }).eq("id", booking.id)

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
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
