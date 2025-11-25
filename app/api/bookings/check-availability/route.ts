import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { booking_date, start_time, duration_hours } = await request.json()

    // 1. Calculate End Time
    const [hours, minutes] = start_time.split(":").map(Number)
    const totalMinutes = (hours * 60) + minutes + (duration_hours * 60)
    
    // Format times for DB comparison
    const formattedStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
    const endH = Math.floor(totalMinutes / 60)
    const endM = totalMinutes % 60
    const formattedEndTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}:00`

    // 2. Count bookings that overlap with this requested slot
    const { count, error } = await supabase
      .from("bookings")
      .select("*", { count: 'exact', head: true }) // head: true means we only want the count, not data
      .eq("booking_date", booking_date)
      .neq("status", "cancelled")
      // Logic: A booking overlaps if it starts BEFORE our end AND ends AFTER our start
      .lt("start_time", formattedEndTime)
      .gt("end_time", formattedStartTime)

    if (error) throw error

    // 3. Compare against 3 Bays
    const TOTAL_BAYS = 3
    const isAvailable = (count || 0) < TOTAL_BAYS

    return NextResponse.json({
      available: isAvailable,
      conflicting_bookings: count || 0,
      capacity: TOTAL_BAYS
    })
  } catch (error) {
    console.error("[v0] Availability check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
