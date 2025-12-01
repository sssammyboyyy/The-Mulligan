import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json({ error: "Missing Booking ID" }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Fetch Booking Details
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (error || !booking) {
      console.error("Booking not found for email trigger:", bookingId)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // 2. Prepare Payload
    const depositAmount = booking.total_price // Modify if you use deposit logic
    
    // Safety check for calculated values
    const totalPrice = Number(booking.total_price) || 0
    let calculatedDeposit = totalPrice
    
    // If logic dictates specific deposit rules, apply them here
    // For now, passing total through to ensure email gets data
    
    const payload = {
        secret: "mulligan-secure-8821", // MATCHES N8N NODE
        bookingId: booking.id,
        yocoId: booking.yoco_payment_id || "manual",
        paymentStatus: booking.payment_status || "paid",
        
        // Email Data
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        guest_phone: booking.guest_phone,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        simulator_id: booking.simulator_id,
        
        // Money Data
        depositPaid: totalPrice.toFixed(2), 
        outstandingBalance: "0.00",
        totalPrice: totalPrice.toFixed(2)
    }

    // 3. Send to n8n (FIRE AND FORGET)
    const n8nUrl = "https://n8n.srv1127912.hstgr.cloud/webhook/manual-confirm"
    
    // We create the promise but don't await the result to block the response
    // ensuring the UI feels fast
    // @ts-ignore
    const promise = fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(res => {
        console.log("n8n Triggered:", res.status)
    }).catch(err => {
        console.error("n8n Failed:", err)
    })

    // Cloudflare Workers optimization to keep script alive for the async fetch
    // @ts-ignore
    if (typeof request.waitUntil === 'function') {
        // @ts-ignore
        request.waitUntil(promise)
    } else {
        // Fallback for local dev environment
        await promise
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Trigger Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
