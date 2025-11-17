export const runtime = "edge"

import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const bookingData = await request.json()

    // Calculate end time
    const [hours, minutes] = bookingData.start_time.split(":").map(Number)
    const durationHours = Math.floor(bookingData.duration_hours)
    const durationMinutes = Math.round((bookingData.duration_hours % 1) * 60)
    const endHours = hours + durationHours
    const endMinutes = minutes + durationMinutes
    const end_time = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`

    // Check for overlapping bookings
    const { data: existingBookings, error: checkError } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_date", bookingData.booking_date)
      .or(`and(start_time.lte.${end_time},end_time.gt.${bookingData.start_time})`)
      .neq("status", "cancelled")

    if (checkError) {
      console.error("[v0] Error checking availability:", checkError)
      return NextResponse.json({ error: "Failed to check availability" }, { status: 500 })
    }

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json({ error: "Time slot not available due to overlapping booking" }, { status: 409 })
    }

    // Create booking
    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        ...bookingData,
        end_time,
        user_type: "adult",
        base_price: bookingData.total_price,
        status: bookingData.payment_status === "completed" ? "confirmed" : "pending",
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error creating booking:", insertError)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    return NextResponse.json({ success: true, booking_id: booking.id })
  } catch (error) {
    console.error("[v0] Booking creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
