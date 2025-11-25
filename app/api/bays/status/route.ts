import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// 1. Force Edge Runtime (Required for Cloudflare Pages)
export const runtime = "edge"

export async function GET() {
  try {
    // 2. Initialize Supabase
    // Note: This uses your public anon key. 
    // Ensure your Supabase RLS (Policies) allows "Select" on the 'bookings' table for public users
    // OR use the Service Role Key if you have it stored in env vars for full access.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 3. Get Current Time (UTC ISO String)
    const now = new Date().toISOString()

    // 4. Query Database
    // "Find confirmed bookings that started before now AND end after now"
    const { data: activeBookings, error } = await supabase
      .from("bookings")
      .select("simulator_id")
      .eq("status", "confirmed")
      .lte("slot_start", now) // Started <= Now
      .gt("slot_end", now)    // End > Now

    if (error) {
      console.error("Supabase Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 5. Calculate Status for Bays 1, 2, 3
    // Extract IDs of busy simulators (e.g., [1, 3])
    const occupiedIds = activeBookings ? activeBookings.map((b) => b.simulator_id) : []

    const bays = [1, 2, 3].map((id) => ({
      id,
      status: occupiedIds.includes(id) ? "occupied" : "available",
      label: `Bay ${id}` // You can rename this if you want "Simulator 1" etc.
    }))

    // Count how many are green
    const availableCount = bays.filter((b) => b.status === "available").length

    // 6. Return JSON with No-Cache Headers
    // Vital for "Live" data so the browser doesn't save the result
    return NextResponse.json(
      { 
        bays, 
        availableCount,
        serverTime: now
      }, 
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        }
      }
    )

  } catch (error) {
    console.error("Internal Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
