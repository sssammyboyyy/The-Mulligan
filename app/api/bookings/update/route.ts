import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { getOperatingHours, isClosedDay } from "@/lib/schedule-config"

export const runtime = "edge"

// --- TIMESTAMP HELPERS (same as create route for consistency) ---
function createSASTTimestamp(dateStr: string, timeStr: string): string {
    const cleanTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr
    return `${dateStr}T${cleanTime}+02:00`
}

function addHoursToTimestamp(timestamp: string, hours: number): string {
    const date = new Date(timestamp)
    date.setHours(date.getHours() + hours)
    return date.toISOString()
}

function calculateEndTimeText(start: string, duration: number): string {
    const [hours, minutes] = start.split(":").map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    date.setHours(date.getHours() + duration)
    return date.toTimeString().slice(0, 5)
}

export async function POST(req: Request) {
    try {
        const {
            id,
            pin,
            updates
        } = await req.json()

        // 1. Auth Check
        if (pin !== "8821") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!id || !updates) {
            return NextResponse.json({ error: "Missing ID or Update Data" }, { status: 400 })
        }

        // 2. Initialize Admin Client (Bypasses RLS)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 3. Check if we need to recalculate timestamps
        // This happens when start_time, duration_hours, or booking_date change
        const needsTimestampRecalc =
            updates.start_time !== undefined ||
            updates.duration_hours !== undefined ||
            updates.booking_date !== undefined

        let finalUpdates = { ...updates }

        if (needsTimestampRecalc) {
            // Fetch current booking to get any missing values
            const { data: currentBooking, error: fetchError } = await supabaseAdmin
                .from("bookings")
                .select("booking_date, start_time, duration_hours")
                .eq("id", id)
                .single()

            if (fetchError || !currentBooking) {
                console.error("Fetch Error:", fetchError)
                return NextResponse.json({ error: "Booking not found" }, { status: 404 })
            }

            // Merge current values with updates (updates take priority)
            // Merge current values with updates (updates take priority)
            const bookingDate = updates.booking_date ?? currentBooking.booking_date
            const startTime = updates.start_time ?? currentBooking.start_time
            const durationHours = updates.duration_hours ?? currentBooking.duration_hours

            // VALIDATE SCHEDULE
            if (isClosedDay(bookingDate)) {
                return NextResponse.json(
                    { error: "The Mulligan is closed on this date." },
                    { status: 400 }
                )
            }

            const operatingHours = getOperatingHours(new Date(bookingDate))
            if (!operatingHours) {
                return NextResponse.json(
                    { error: "The Mulligan is closed on this date." },
                    { status: 400 }
                )
            }

            // Recalculate timestamps
            const slotStartISO = createSASTTimestamp(bookingDate, startTime)
            const slotEndISO = addHoursToTimestamp(slotStartISO, durationHours)
            const endTimeText = calculateEndTimeText(startTime, durationHours)

            const reqStartMs = new Date(slotStartISO).getTime()
            const reqEndMs = new Date(slotEndISO).getTime()

            // VALIDATE OPERATING HOURS (Hard Close)
            // SAST-safe open/close times
            const openIso = `${bookingDate}T${operatingHours.open.toString().padStart(2, '0')}:00:00+02:00`
            const closeIso = `${bookingDate}T${operatingHours.close.toString().padStart(2, '0')}:00:00+02:00`
            const openTimeMs = new Date(openIso).getTime()
            const closeTimeMs = new Date(closeIso).getTime()

            if (reqStartMs < openTimeMs || reqEndMs > closeTimeMs) {
                return NextResponse.json(
                    { error: `Booking must be between ${operatingHours.open}:00 and ${operatingHours.close}:00` },
                    { status: 400 }
                )
            }

            // Add recalculated fields to updates
            finalUpdates = {
                ...finalUpdates,
                slot_start: slotStartISO,
                slot_end: slotEndISO,
                end_time: endTimeText,
                updated_at: new Date().toISOString()
            }
        }

        // 4. Apply Update
        const { error } = await supabaseAdmin
            .from("bookings")
            .update(finalUpdates)
            .eq("id", id)

        if (error) {
            console.error("Update Error:", error)
            throw error
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
