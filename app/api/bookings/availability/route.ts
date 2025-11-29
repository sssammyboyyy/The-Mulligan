import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")

  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("slot_start, slot_end, simulator_id")
    .eq("booking_date", date)
    .neq("status", "cancelled")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const slots: string[] = []
  for (let h = 9; h < 20; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`)
    slots.push(`${h.toString().padStart(2, "0")}:30`)
  }

  const bookedSlots: string[] = []
  const getSlotTimeISO = (dateStr: string, timeStr: string) => `${dateStr}T${timeStr}:00+02:00`

  slots.forEach((time) => {
    const slotTimeISO = getSlotTimeISO(date, time)
    
    const activeBookings = bookings.filter((b) => {
      return b.slot_start <= slotTimeISO && b.slot_end > slotTimeISO
    })

    if (activeBookings.length >= 3) {
      bookedSlots.push(time)
    }
  })

  return NextResponse.json({ bookedSlots }) 
}
