import { createClient } from "@supabase/supabase-js"

// 1. Force DISABLE CACHE
export const dynamic = "force-dynamic" // <--- CRITICAL FIX for Admin visibility

export async function GET() {
  try {
    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 2. Fetch TODAY'S active bookings
    const now = new Date()
    const startOfDay = new Date(now).setHours(0,0,0,0)
    const endOfDay = new Date(now).setHours(23,59,59,999)

    const { data: activeBookings, error } = await supabase
      .from("bookings")
      .select("simulator_id, slot_start, slot_end, status")
      .neq("status", "cancelled") 
      .gte("slot_end", new Date(startOfDay).toISOString())
      .lte("slot_start", new Date(endOfDay).toISOString())

    if (error) {
      console.error("Supabase Error:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    // 3. Precise JS Time Comparison (Timezone Safe)
    const nowMs = now.getTime()
    
    const currentLiveBookings = activeBookings?.filter((b: any) => {
      const startMs = new Date(b.slot_start).getTime()
      const endMs = new Date(b.slot_end).getTime()
      return startMs <= nowMs && endMs > nowMs
    }) || []

    // 4. Map IDs
    const occupiedIds = currentLiveBookings.map((b: any) => b.simulator_id)

    const bays = [1, 2, 3].map((id) => ({
      id,
      status: occupiedIds.includes(id) ? "occupied" : "available",
      label: `Simulator ${id}`
    }))

    const availableCount = bays.filter((b) => b.status === "available").length

    return Response.json(
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
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
