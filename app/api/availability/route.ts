import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get("date")

        if (!date) {
            return Response.json({ error: "Date is required" }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Fetch all bookings for the date
        const { data: bookings, error } = await supabase
            .from("bookings")
            .select("start_time, duration_hours, simulator_id")
            .eq("booking_date", date)
            .neq("status", "cancelled")

        if (error) throw error

        // Initialize time slots (06:00 to 22:00)
        const timeSlots: any[] = []

        for (let i = 6; i <= 22; i++) {
            const hour = i.toString().padStart(2, '0') + ":00"
            timeSlots.push({
                time: hour,
                bookings: 0,
                capacity: 3,
                available: true
            })
        }

        // Occupancy calculation
        bookings?.forEach(booking => {
            const startHour = parseInt(booking.start_time.split(':')[0])
            const duration = Math.ceil(booking.duration_hours)

            for (let i = 0; i < duration; i++) {
                const h = (startHour + i)
                const slot = timeSlots.find(s => parseInt(s.time.split(':')[0]) === h)
                if (slot) {
                    slot.bookings += 1
                    if (slot.bookings >= 3) {
                        slot.available = false
                    }
                }
            }
        })

        return Response.json(timeSlots)

    } catch (error: any) {
        console.error("Availability API Error:", error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
