import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")

  if (!date) {
    return NextResponse.json({ error: "Date parameter is required" }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    // 1. Get all bookings for the selected date
    // We fetch anything that is NOT cancelled. 
    // This includes 'pending' (someone currently paying) and 'confirmed'.
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("start_time")
      .eq("booking_date", date)
      .neq("status", "cancelled") 

    if (error) {
      console.error("Availability Fetch Error:", error)
      // Return 500 so the frontend knows something is wrong, rather than assuming empty
      return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
    }

    // 2. Extract just the time strings (e.g., ["09:00", "14:00"])
    // Safely handles cases where start_time might be formatted differently
    const bookedSlots = (bookings || [])
      .map((b) => b.start_time?.substring(0, 5))
      .filter(Boolean)

    return NextResponse.json({ bookedSlots })
    
  } catch (error) {
    console.error("Server Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
