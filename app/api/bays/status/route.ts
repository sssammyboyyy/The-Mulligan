import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// 1. Force Edge Runtime & DISABLE CACHE
export const runtime = "edge"
export const dynamic = "force-dynamic" // <--- CRITICAL FIX for Admin visibility

export async function GET() {
  try {
    // Initialize Supabase
    // Ideally use process.env.SUPABASE_SERVICE_ROLE_KEY if available for Admin bypass
    // Otherwise ensure your Public/Anon key has SELECT permissions on 'bookings'
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 2. Fetch TODAY'S active bookings
    // We fetch a slightly wider window to filter in JS for precision
    const now = new Date()
    const startOfDay = new Date(now).setHours(0,0,0,0)
    const endOfDay = new Date(now).setHours(23,59,59,999)

    const { data: activeBookings, error } = await supabase
      .from("bookings")
      .select("simulator_id, slot_start, slot_end, status")
      // Check Confirmed OR Pending (if someone is paying right now, mark it occupied)
      .neq("status", "cancelled") 
      .gte("slot_end", new Date(startOfDay).toISOString()) // Optimization
      .lte("slot_start", new Date(endOfDay).toISOString())

    if (error) {
      console.error("Supabase Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 3. Precise JS Time Comparison (Timezone Safe)
    const nowMs = now.getTime()
    
    // Filter: Booking must be effectively "Live" right now
    const currentLiveBookings = activeBookings?.filter(b => {
      const startMs = new Date(b.slot_start).getTime()
      const endMs = new Date(b.slot_end).getTime()
      // It is live if: Start is in past AND End is in future
      return startMs <= nowMs && endMs > nowMs
    }) || []

    // 4. Map IDs
    const occupiedIds = currentLiveBookings.map((b) => b.simulator_id)

    const bays = [1, 2, 3].map((id) => ({
      id,
      status: occupiedIds.includes(id) ? "occupied" : "available",
      label: `Simulator ${id}`
    }))

    const availableCount = bays.filter((b) => b.status === "available").length

    return NextResponse.json(
      { 
        bays, 
        availableCount,
        serverTime: now.toISOString()
      }, 
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        }
      }
    )

  } catch (error) {
    console.error("Internal Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
