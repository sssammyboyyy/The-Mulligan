import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { bookingId } = body
    
    // Existing n8n Webhook
    const N8N_URL = "https://n8n.srv1127912.hstgr.cloud/webhook/manual-confirm" 

    // We send a FLAT structure that matches trigger-n8n/route.ts
    // This ensures your n8n {{ $json.depositPaid }} variables work consistently
    const payload = {
      secret: "mulligan-secure-8821",
      bookingId: bookingId,
      yocoId: "manual_coupon_bypass",
      paymentStatus: "paid_instore",
      
      // We might not have full guest details here if just passing ID, 
      // but n8n can fetch them using the ID if needed. 
      // ideally, you should pass these from the client or fetch them here.
      // For now, we assume n8n might look them up or we pass generic data to prevent errors:
      guest_name: "Guest (Coupon/Manual)",
      guest_email: "admin@themulligan.co.za", // Fallback
      
      // Money Data (FLAT STRUCTURE)
      // Since this is a bypass/coupon, we assume R0 outstanding
      depositPaid: "0.00", 
      outstandingBalance: "0.00",
      totalPrice: "0.00 (Coupon)"
    }

    await fetch(N8N_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json({ error: "Failed to trigger automation" }, { status: 500 })
  }
}
