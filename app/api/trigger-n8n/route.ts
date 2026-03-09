import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCorrelationId, logEvent, validateEnvVars } from "@/lib/utils"

export const runtime = "edge"

// Bay name mapping for human-readable emails
const BAY_NAMES: Record<number, string> = {
  1: "Lounge Bay",
  2: "Middle Bay",
  3: "Window Bay"
}

function getBayName(simulatorId: number | null): string {
  if (!simulatorId) return "Unassigned"
  return BAY_NAMES[simulatorId] || `Bay ${simulatorId}`
}

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request)

  try {
    const envCheck = validateEnvVars([
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "YOCO_SECRET_KEY"
    ])
    if (envCheck) {
      logEvent("env_validation_failed", { correlationId, missing: envCheck.missing }, "error")
      return NextResponse.json(
        { success: false, error: "Server configuration error", error_code: "MISSING_ENV", correlation_id: correlationId },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { bookingId } = body

    if (!bookingId) {
      logEvent("missing_booking_id", { correlationId }, "error")
      return NextResponse.json(
        { success: false, error: "Missing Booking ID", error_code: "MISSING_BOOKING_ID", correlation_id: correlationId },
        { status: 400 }
      )
    }

    logEvent("trigger_n8n_start", { correlationId, bookingId })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 1. ATOMIC GUARD: Check if already sent
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (error || !booking) {
      logEvent("booking_not_found", { correlationId, bookingId, error: error?.message }, "error")
      return NextResponse.json(
        { success: false, error: "Booking not found", error_code: "BOOKING_NOT_FOUND", correlation_id: correlationId },
        { status: 404 }
      )
    }

    if (booking.email_sent) {
      logEvent("trigger_n8n_skipped", { correlationId, bookingId, reason: "already_sent" })
      return NextResponse.json({ success: true, message: "Already processed", skipped: true })
    }

    // 2. ROBUST SELF-HEALING (Charge Scanning)
    let dbTotal = Number(booking.total_price) || 0
    let dbPaid = Number(booking.amount_paid) || 0
    let paymentStatus = booking.payment_status

    if (booking.yoco_payment_id && dbPaid === 0) {
      console.log(`[Bulletproof Sync] Verifying with Yoco: ${booking.yoco_payment_id}`)

      try {
        const yocoRes = await fetch(`https://payments.yoco.com/api/checkouts/${booking.yoco_payment_id}`, {
          headers: { 'Authorization': `Bearer ${process.env.YOCO_SECRET_KEY}` }
        })

        if (yocoRes.ok) {
          const yocoData = await yocoRes.json()
          const isSuccessful = ['successful', 'captured', 'paid'].includes(yocoData.status)

          if (isSuccessful) {
            // DEEP SCAN: Look for actual successful charges
            // Priority: metadata.depositPaid -> successful charges -> fallback to total if all else fails but status is success
            const successfulCharge = yocoData.charges?.find((c: any) => c.status === 'successful')

            const paidInRand = successfulCharge
              ? successfulCharge.amount / 100
              : (yocoData.metadata?.depositPaid ? parseFloat(yocoData.metadata.depositPaid) : dbTotal)

            dbPaid = paidInRand
            paymentStatus = "completed"

            // Update state machine foundations
            await supabaseAdmin
              .from("bookings")
              .update({
                amount_paid: dbPaid,
                payment_status: paymentStatus,
                status: "confirmed",
                payment_verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq("id", bookingId)
          }
        }
      } catch (err) {
        console.error("[Bulletproof Sync] Yoco verification failed:", err)
      }
    }

    const outstanding = dbTotal - dbPaid
    const isShortSession = (booking.duration_hours || 0) <= 1

    // 3. SEND TO n8n
    const payload = {
      secret: process.env.N8N_SECRET || "mulligan-secure-8821",
      bookingId: booking.id,
      yocoId: booking.yoco_payment_id || "manual",
      paymentStatus: paymentStatus,
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      guest_phone: booking.guest_phone,
      booking_date: booking.booking_date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      simulator_id: booking.simulator_id,
      bay_name: getBayName(booking.simulator_id),
      time_slot: `${(booking.start_time || "").slice(0, 5)} - ${(booking.end_time || "").slice(0, 5)}`,
      player_count: booking.player_count || 1,
      duration_hours: booking.duration_hours || 1,
      is_short_session: isShortSession,
      session_type: booking.session_type || "quick",
      total_price: dbTotal.toFixed(2),
      amount_paid: dbPaid.toFixed(2),
      amount_due: outstanding.toFixed(2),
      addon_coaching: booking.addon_coaching || false,
      addon_club_rental: booking.addon_club_rental || false
    }

    const email = booking.guest_email || ""
    const isMockEmail = email.includes("venue-os.com")
    if (isMockEmail) {
      console.log(`[Trigger Skipped] Mock Email: ${email}`)
      return NextResponse.json({ success: true, skipped: true, reason: "Mock Email" })
    }

    const n8nUrl = process.env.N8N_WEBHOOK_URL || "https://n8n.srv1127912.hstgr.cloud/webhook/manual-confirm"

    let attempt = 0
    let success = false
    let lastError = ""
    let n8nResponseText = ""

    while (attempt < 3 && !success) {
      attempt++
      try {
        console.log(`[Trigger n8n] Attempt ${attempt} -> ${n8nUrl}`)
        const n8nRes = await fetch(n8nUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })

        if (n8nRes.ok) {
          success = true
          n8nResponseText = await n8nRes.text()
        } else {
          lastError = `HTTP ${n8nRes.status}: ${await n8nRes.text()}`
        }
      } catch (err: any) {
        lastError = err.message
      }
    }

    // 4. FINAL STATE MACHINE UPDATE
    await supabaseAdmin
      .from("bookings")
      .update({
        email_sent: success,
        email_sent_at: success ? new Date().toISOString() : null,
        n8n_status: success ? 'sent' : 'error',
        n8n_response: n8nResponseText.slice(0, 1000),
        n8n_attempts: attempt,
        n8n_last_error: success ? null : lastError.slice(0, 1000)
      })
      .eq("id", bookingId)

    return NextResponse.json({
      success,
      email_sent: success,
      n8n_attempts: attempt,
      correlation_id: correlationId
    })

  } catch (error: any) {
    logEvent("trigger_n8n_error", { correlationId, error: error.message }, "error")
    return NextResponse.json(
      { success: false, error: error.message, error_code: "TRIGGER_ERROR", correlation_id: correlationId },
      { status: 500 }
    )
  }
}
