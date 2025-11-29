import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { bookingId } = body
    
    // Point to your EXISTING n8n Webhook
    const N8N_URL = "https://n8n.srv1127912.hstgr.cloud/webhook/payment-webhook" 

    // Simulate a Yoco Payload so n8n understands it
    const payload = {
      type: "payment.succeeded", 
      payload: {
        id: "manual_coupon_bypass",
        amount: 0,
        status: "succeeded",
        metadata: {
          bookingId: bookingId,
          depositPaid: "0.00", 
          outstandingBalance: "0.00",
          totalPrice: "0.00 (Coupon)"
        }
      }
    }

    await fetch(N8N_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-yoco-timestamp": Date.now().toString(),
        "x-yoco-signature": "bypass_manual_auth" 
      },
      body: JSON.stringify(payload)
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json({ error: "Failed to trigger automation" }, { status: 500 })
  }
}
