import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")

  if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 })

  try {
    const supabase = await createClient()

    // 1. Get all active bookings for this date
    const { data: bookings } = await supabase
      .from("bookings")
      .select("start_time")
      .eq("booking_date", date)
      .neq("status", "cancelled")

    // 2. Count bookings per hour
    // Example: { "14:00": 1, "15:00": 3 }
    const slotCounts: Record<string, number> = {}
    
    bookings?.forEach((b) => {
      const time = b.start_time.substring(0, 5) // ensure "14:00" format
      slotCounts[time] = (slotCounts[time] || 0) + 1
    })

    // 3. Find Full Slots (Where count >= 3)
    const MAX_BAYS = 3
    const bookedSlots = Object.keys(slotCounts).filter(time => slotCounts[time] >= MAX_BAYS)

    return NextResponse.json({ bookedSlots })
    
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 })
  }
}
