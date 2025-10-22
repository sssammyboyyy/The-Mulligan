import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateReferralCode } from "@/lib/upsells"

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

    // Check if first-time user
    let isFirstBooking = true
    if (guest_email) {
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('guest_email', guest_email)
        .eq('status', 'confirmed')
        .limit(1)
      
      isFirstBooking = !existingBookings || existingBookings.length === 0
    }

    // Determine verification status and notes
    const studentVerified = user_type === 'student'
    const ageVerified = user_type === 'junior' || user_type === 'senior'
    
    let verificationNotes = null
    if (user_type === 'student') {
      verificationNotes = 'Student ID verification required at check-in'
    } else if (user_type === 'junior') {
      verificationNotes = 'Age verified as under 18'
    } else if (user_type === 'senior') {
      verificationNotes = 'Age verified as 60+'
    }

    // Check if referral offer was selected
    const hasReferralOffer = upsells && upsells.some((u: any) => u.category === 'referral_offer')

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
        is_first_booking: isFirstBooking,
        student_verified: studentVerified,
        age_verified: ageVerified,
        verification_notes: verificationNotes,
        referral_code: hasReferralOffer && isFirstBooking ? null : null, // Will be generated after booking confirmed
      })
      .select()
      .single()

    if (bookingError) {
      console.error("Booking creation error:", bookingError)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    // Generate referral code if first-time user and referral offer selected
    let referralCode = null
    if (hasReferralOffer && isFirstBooking && booking.id) {
      referralCode = generateReferralCode(booking.id)
      
      // Update booking with referral code
      await supabase
        .from('bookings')
        .update({ referral_code: referralCode })
        .eq('id', booking.id)
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
      console.error("Paystack initialization error:", paystackData)
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
    console.error("Payment initialization error:", error)
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
