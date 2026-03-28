export const dynamic = "force-dynamic"

import { createClient } from "@supabase/supabase-js"
import { getCorrelationId, logEvent, validateEnvVars } from "@/lib/logger"
import { getSupabaseAdmin } from "@/lib/supabase/client"
import { getOperatingHours } from "@/lib/schedule-config"
import { sendConfirmationEmail } from "@/lib/mail"
import { NextResponse } from "next/server"

// Helper: Calculate text end time
function calculateEndTimeText(start: string, duration: number): string {
  const [hours, minutes] = start.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  date.setHours(date.getHours() + duration)
  return date.toTimeString().slice(0, 5)
}

// Helper: Safely parse Postgres timestamptz strings into Milliseconds
function parsePgDate(pgDateStr: string): number {
  if (!pgDateStr) return 0;
  let safeStr = pgDateStr.replace(' ', 'T');
  if (/([+-]\d{2})$/.test(safeStr)) {
    safeStr += ':00';
  }
  const ms = new Date(safeStr).getTime();
  return isNaN(ms) ? 0 : ms;
}

export async function POST(request: Request) {
  const correlationId = getCorrelationId(request)
  const idempotencyKey = (request as any).headers.get("x-idempotency-key")

  logEvent("booking_initialize_start", { correlationId, idempotencyKey })

  try {
    const envCheck = validateEnvVars([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "YOCO_SECRET_KEY"
    ])
    if (envCheck) {
      logEvent("env_validation_failed", { correlationId, missing: envCheck.missing }, "error")
      return Response.json(
        { error: "Server configuration error", error_code: "MISSING_ENV", correlation_id: correlationId },
        { status: 500 }
      )
    }

    const body = await request.json()

    // --- WALK-IN BYPASS ---
    // Gate walk-ins to prevent Yoco/Resend initialization or env validation failures
    if (body.guest_email?.toLowerCase().includes('walkin@venue-os.com') || body.user_type === 'walk_in') {
      logEvent("walkin_bypass_triggered", { correlationId })
      
      // Async trigger confirmation email for walk-ins if email is provided
      if (body.guest_email && !body.guest_email.toLowerCase().includes('walkin@venue-os.com')) {
        await sendConfirmationEmail({
          guest_email: body.guest_email,
          guest_name: body.guest_name || "Golfer",
          booking_date: body.booking_date,
          start_time: body.start_time,
          duration_hours: Number(body.duration_hours),
          player_count: Number(body.player_count),
          simulator_id: 1, // Default to 1 for bypass if not assigned yet
          total_price: Number(body.total_price),
          amount_paid: 0, 
        });
      }

      return NextResponse.json({ 
        success: true, 
        bypassed: true, 
        message: 'Walk-in bypass - skipping payment initialization' 
      })
    }

    // --- MAPPING VARIABLES ---
    const booking_date = body.booking_date || body.date
    const start_time = body.start_time || body.timeSlot
    const duration_hours = body.duration_hours || body.duration
    const player_count = body.player_count || body.players

    const session_type = body.session_type || body.sessionType
    const famous_course_option = body.famous_course_option || body.sessionType

    const base_price = body.base_price || 0
    const total_price = body.total_price || body.totalPrice

    const guest_name = body.guest_name || body.customerName
    const guest_email = body.guest_email || body.customerEmail
    const guest_phone = body.guest_phone || body.customerPhone

    const {
      accept_whatsapp,
      enter_competition,
      coupon_code,
      pay_full_amount,
      addon_coaching,
      addon_club_rental
    } = body

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Admin client for bypasses
    const supabaseAdmin = getSupabaseAdmin()

    // ---------------------------------------------------------
    // 2. ROBUST COUPON & PRICE LOGIC
    // ---------------------------------------------------------
    let dbTotalPrice = Number(total_price)
    let dbPaymentStatus = "pending"
    let dbStatus = "pending"
    let skipYoco = false
    let couponApplied = null

    const cleanCouponCode = coupon_code ? String(coupon_code).trim().toUpperCase() : null

    if (cleanCouponCode && cleanCouponCode.length > 0) {
      const { data: couponData } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", cleanCouponCode)
        .eq("is_active", true)
        .single()

      if (couponData) {
        couponApplied = cleanCouponCode
        if (cleanCouponCode === "MULLIGAN_ADMIN_100") {
          dbTotalPrice = Number(base_price)
          dbPaymentStatus = "paid_instore"
          dbStatus = "confirmed"
          skipYoco = true
        } else if (couponData.discount_percent === 100) {
          dbTotalPrice = 0
          dbPaymentStatus = "completed"
          dbStatus = "confirmed"
          skipYoco = true
        } else if (couponData.discount_percent > 0) {
          const discountAmount = (Number(base_price) * (couponData.discount_percent / 100));
          dbTotalPrice = Math.max(0, Number(base_price) - discountAmount);
        }
      }
    }

    if (dbTotalPrice === 0 && !skipYoco) {
      dbPaymentStatus = "completed"
      dbStatus = "confirmed"
      skipYoco = true
    }

    // ---------------------------------------------------------
    // 3. ROBUST DATE CALCULATION
    // ---------------------------------------------------------
    const cleanTime = (start_time || "").length === 5 ? `${start_time}:00` : start_time;
    const sastStartIso = `${booking_date}T${cleanTime}+02:00`;
    const durationNum = Number(duration_hours);
    const startDate = new Date(sastStartIso);

    if (isNaN(startDate.getTime()) || isNaN(durationNum)) {
      return Response.json({
        error: "Invalid date or duration format",
        error_code: "INVALID_DATE",
        correlation_id: correlationId
      }, { status: 400 });
    }

    const endDate = new Date(startDate.getTime() + (durationNum * 60 * 60 * 1000));

    const operatingHours = getOperatingHours(startDate);
    if (operatingHours) {
      const closeIso = `${booking_date}T${operatingHours.close.toString().padStart(2, '0')}:00:00+02:00`;
      const closeTimeMs = new Date(closeIso).getTime();
      if (endDate.getTime() > closeTimeMs) {
        return Response.json({
          error: `The venue closes at ${operatingHours.close}:00. Please shorten your session.`,
          error_code: "PAST_CLOSING_TIME",
          correlation_id: correlationId
        }, { status: 400 });
      }
    }

    const slotStartLiteral = sastStartIso;
    const slotEndLiteral = endDate.toISOString();
    const endTimeText = calculateEndTimeText(start_time, durationNum);

    const reqStartMs = startDate.getTime()
    const reqEndMs = endDate.getTime()
    const bookingRequestId = body.booking_request_id || idempotencyKey || crypto.randomUUID()

    const { data: simulators } = await supabase.from("simulators").select("id").order("id", { ascending: true })
    const simulatorIds = simulators?.length ? simulators.map(s => s.id) : [1, 2, 3]

    const { data: dailyBookings } = await supabaseAdmin
      .from("bookings")
      .select("id, simulator_id, start_time, slot_start, slot_end, status, created_at, yoco_payment_id, booking_request_id, guest_email")
      .eq("booking_date", booking_date)

    const takenBays = new Set<number>();
    const now = Date.now();
    const ghostDeleteIds: string[] = [];

    if (dailyBookings) {
      dailyBookings.forEach(b => {
        let isGhost = false;
        if (b.status === 'pending') {
          const createdTime = parsePgDate(b.created_at);
          const ageMs = now - createdTime;
          // Ghost patch: Only delete if actually old (5 mins)
          if (ageMs > 300000) {
            isGhost = true;
            ghostDeleteIds.push(b.id);
          }
        }

        if (isGhost || b.status === 'cancelled') return;

        const isSelfRecovery = (b.guest_email === guest_email && b.start_time === start_time && b.status === 'confirmed');
        if (b.booking_request_id === bookingRequestId || isSelfRecovery) return;

        // Date parse patch used here
        const bStart = parsePgDate(b.slot_start);
        const bEnd = parsePgDate(b.slot_end);
        const isOverlapping = (bStart < reqEndMs) && (bEnd > reqStartMs);

        if (isOverlapping) takenBays.add(b.simulator_id);
      });
    }

    if (ghostDeleteIds.length > 0) {
      await supabaseAdmin.from("bookings").delete({ count: 'exact' }).in("id", ghostDeleteIds)
    }

    let assignedSimulatorId = 0
    for (const id of simulatorIds) {
      if (!takenBays.has(id)) {
        assignedSimulatorId = id
        break
      }
    }

    if (assignedSimulatorId === 0) {
      return Response.json(
        {
          error: "Sorry, all bays are full for this time slot.",
          error_code: "SLOT_UNAVAILABLE",
          correlation_id: correlationId
        },
        { status: 409 }
      )
    }

    // ---------------------------------------------------------
    // 4. DEPOSIT LOGIC 
    // ---------------------------------------------------------
    let amountToCharge = dbTotalPrice;
    const sessionStr = String(session_type || "").toLowerCase();
    const optionStr = String(famous_course_option || "").toLowerCase();
    const isDepositEligible = sessionStr.includes("famous") || sessionStr.includes("ball") || optionStr.includes("ball");

    if (isDepositEligible && !pay_full_amount) amountToCharge = Math.ceil(dbTotalPrice * 0.40);
    const outstandingBalance = dbTotalPrice - amountToCharge;

    // ---------------------------------------------------------
    // 5. CREATE DB ROW (SupabaseAdmin applied)
    // ---------------------------------------------------------
    const { data: existingBooking } = await supabase.from("bookings").select("*").eq("booking_request_id", bookingRequestId).maybeSingle()
    let booking = existingBooking;

    if (!booking) {
      const { data: newBooking, error: bookingError } = await supabaseAdmin // Admin Bypass
        .from("bookings")
        .insert({
          booking_request_id: bookingRequestId,
          booking_date,
          start_time,
          end_time: endTimeText,
          slot_start: slotStartLiteral,
          slot_end: slotEndLiteral,
          duration_hours,
          player_count,
          simulator_id: assignedSimulatorId,
          user_type: "guest",
          session_type,
          famous_course_option,
          base_price,
          total_price: dbTotalPrice,
          amount_paid: skipYoco ? dbTotalPrice : 0,
          payment_type: skipYoco ? 'bypass' : (outstandingBalance > 0 ? 'deposit' : 'full'),
          status: dbStatus,
          payment_status: dbPaymentStatus,
          guest_name,
          guest_email,
          guest_phone,
          accept_whatsapp,
          enter_competition,
          coupon_code: couponApplied,
          addon_coaching: addon_coaching || false,
          addon_club_rental: addon_club_rental || false,
        })
        .select()
        .single()

      if (bookingError) {
        if (bookingError.code === "23503") {
          return Response.json({ error: "Invalid simulator configuration.", error_code: "SIMULATOR_FK_VIOLATION", correlation_id: correlationId }, { status: 500 })
        }

        if (bookingError.code === '23P01' || bookingError.message?.includes('exclusion constraint')) {
          const { error: forceDeleteError } = await supabaseAdmin.from("bookings").delete().eq("booking_date", booking_date).eq("simulator_id", assignedSimulatorId).neq("status", "confirmed")

          if (!forceDeleteError) {
            const { data: retryBooking, error: retryError } = await supabaseAdmin // Admin Bypass
              .from("bookings")
              .insert({
                booking_request_id: bookingRequestId,
                booking_date,
                start_time,
                end_time: endTimeText,
                slot_start: slotStartLiteral,
                slot_end: slotEndLiteral,
                duration_hours,
                player_count,
                simulator_id: assignedSimulatorId,
                user_type: "guest",
                session_type,
                famous_course_option,
                base_price,
                total_price: dbTotalPrice,
                amount_paid: skipYoco ? dbTotalPrice : 0,
                payment_type: skipYoco ? 'bypass' : (outstandingBalance > 0 ? 'deposit' : 'full'),
                status: dbStatus,
                payment_status: dbPaymentStatus,
                guest_name,
                guest_email,
                guest_phone,
                accept_whatsapp,
                enter_competition,
                coupon_code: couponApplied,
                addon_coaching: addon_coaching || false,
                addon_club_rental: addon_club_rental || false,
              })
              .select()
              .single()

            if (retryBooking && !retryError) {
              booking = retryBooking
            } else {
              return Response.json({ error: "This time slot is currently unavailable.", error_code: "SLOT_RACE_CONDITION", correlation_id: correlationId }, { status: 409 })
            }
          } else {
            return Response.json({ error: "This time slot is currently unavailable.", error_code: "SLOT_RACE_CONDITION", correlation_id: correlationId }, { status: 409 })
          }
        }

        if (!booking && bookingError.code === '23505' && bookingError.message?.includes('booking_request_id')) {
          const { data: retryBooking } = await supabase.from("bookings").select("*").eq("booking_request_id", bookingRequestId).single()
          if (retryBooking) booking = retryBooking
        }

        if (!booking) {
          return Response.json({ error: `Booking failed: ${bookingError.message}`, error_code: "BOOKING_INSERT_FAILED", correlation_id: correlationId }, { status: 500 })
        }
      } else {
        booking = newBooking
      }
    }

    // ---------------------------------------------------------
    // FREE TIER / BYPASS EMAIL DISPATCH
    // ---------------------------------------------------------
    // ---------------------------------------------------------
    // 5. THE IRON GATE: BYPASS EMAIL DISPATCH
    // ---------------------------------------------------------
    if (skipYoco) {
      logEvent("bypass_email_dispatch_start", { booking_id: booking.id });
      
      await sendConfirmationEmail({
        guest_email: guest_email,
        guest_name: guest_name || "Golfer",
        booking_date: booking_date,
        start_time: start_time,
        duration_hours: durationNum,
        player_count: player_count,
        simulator_id: assignedSimulatorId,
        total_price: dbTotalPrice,
        amount_paid: dbTotalPrice, // Bypass/Free means we record it as paid
        addon_club_rental,
        addon_coaching
      });

      return Response.json({
        free_booking: true,
        booking_id: booking.id,
        message: dbPaymentStatus === "paid_instore" ? "Walk-in Confirmed" : "Booking confirmed with coupon",
      })
    }

    // ---------------------------------------------------------
    // 6. YOCO CHECKOUT
    // ---------------------------------------------------------
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.themulligan.org"

    const yocoResponse = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amountToCharge * 100),
        currency: "ZAR",
        cancelUrl: `${appUrl}/booking?cancelled=true&reference=${booking.id}`,
        successUrl: `${appUrl}/booking/success?bookingId=${booking.id}`,
        failureUrl: `${appUrl}/booking?error=payment_failed&reference=${booking.id}`,
        metadata: {
          bookingId: booking.id,
          totalPrice: dbTotalPrice.toFixed(2),
          depositPaid: amountToCharge.toFixed(2),
          outstandingBalance: outstandingBalance.toFixed(2),
          isDeposit: (outstandingBalance > 0).toString()
        },
      }),
    })

    const yocoData = await yocoResponse.json()

    if (yocoData.id) {
      await supabaseAdmin // Admin Bypass
        .from("bookings")
        .update({ yoco_payment_id: yocoData.id })
        .eq("id", booking.id)
    }

    if (!yocoResponse.ok) {
      return Response.json({ error: "Payment initialization failed", error_code: "YOCO_CHECKOUT_FAILED", correlation_id: correlationId }, { status: 500 })
    }

    return Response.json({ redirectUrl: yocoData.redirectUrl, booking_id: booking.id })

  } catch (error: any) {
    return Response.json({ error: error.message || "Internal server error", error_code: "INTERNAL_ERROR", correlation_id: correlationId }, { status: 500 })
  }
}