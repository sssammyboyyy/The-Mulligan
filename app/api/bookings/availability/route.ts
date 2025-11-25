export const runtime = "nodejs"

import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get("date")

    if (!dateParam) {
      return NextResponse.json({ bookedSlots: [], error: "Date parameter is required" }, { status: 400 })
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[v0] Missing Supabase environment variables")
      return NextResponse.json({ bookedSlots: [], error: "Server configuration error" }, { status: 500 })
    }

    // Parse and format the date
    const requestDate = new Date(dateParam)
    if (isNaN(requestDate.getTime())) {
      return NextResponse.json({ bookedSlots: [], error: "Invalid date format" }, { status: 400 })
    }
    const formattedDate = requestDate.toISOString().split("T")[0]

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Fetch all bookings for the specified date that are not cancelled
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("start_time, end_time, duration_hours")
      .eq("booking_date", formattedDate)
      .neq("status", "cancelled")

    if (error) {
      console.error("[v0] Supabase query error:", error.message, error.code, error.details)
      return NextResponse.json({
        bookedSlots: [],
        error: "Database query failed",
        details: error.message,
      })
    }

    // Convert bookings to time slot strings (HH:MM format)
    const bookedSlots = (bookings || []).map((booking) => booking.start_time?.substring(0, 5) || "").filter(Boolean)

    return NextResponse.json({
      bookedSlots,
      date: formattedDate,
      totalBookings: bookings?.length || 0,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[v0] Availability API catch error:", errorMessage)
    return NextResponse.json({
      bookedSlots: [],
      error: "Internal server error",
      details: errorMessage,
    })
  }
}
