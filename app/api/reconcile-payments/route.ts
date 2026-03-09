import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "edge"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")
    const secret = searchParams.get("secret")

    // Basic security for cron (unless it's a manual ID-based sync)
    if (!bookingId && secret !== process.env.RECONCILE_SECRET && process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const triggerN8n = async (id: string) => {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://themulligan.org"
        return fetch(`${siteUrl}/api/trigger-n8n`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId: id })
        })
    }

    if (bookingId) {
        // Manual Sync Case
        console.log(`[Reconcile] Manually syncing booking: ${bookingId}`)
        const res = await triggerN8n(bookingId)
        return NextResponse.json({
            success: res.ok,
            status: res.status,
            data: await res.json()
        })
    }

    // Cron Case: Find "Limbo" bookings (Created in last 24h, not fully paid or email not sent)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: limboBookings, error } = await supabase
        .from("bookings")
        .select("id, yoco_payment_id, email_sent, amount_paid, total_price")
        .gt("created_at", twentyFourHoursAgo)
        .or("email_sent.eq.false,amount_paid.eq.0")
        .not("yoco_payment_id", "is", null)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results = []
    for (const b of limboBookings) {
        const res = await triggerN8n(b.id)
        results.push({ id: b.id, status: res.status })
    }

    return NextResponse.json({ processed: results.length, results })
}
