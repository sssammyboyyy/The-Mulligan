import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const simulatorId = searchParams.get('simulator_id')

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('[v0] Supabase credentials not configured')
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      )
    }

    // Build query URL
    let queryUrl = `${supabaseUrl}/rest/v1/bookings?select=simulator_id,slot_start,slot_end,status&status=eq.confirmed`
    
    // Filter by date (assuming slot_start is ISO timestamp)
    queryUrl += `&slot_start=gte.${date}T00:00:00`
    queryUrl += `&slot_start=lt.${date}T23:59:59`
    
    if (simulatorId) {
      queryUrl += `&simulator_id=eq.${simulatorId}`
    }

    console.log('[v0] Fetching availability from:', queryUrl)

    const response = await fetch(queryUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    if (!response.ok) {
      console.error('[v0] Supabase API error:', response.status, await response.text())
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: response.status }
      )
    }

    const bookings = await response.json()
    console.log('[v0] Found bookings:', bookings.length)

    // Transform bookings into unavailable time slots
    const unavailableSlots = bookings.map((booking: any) => ({
      simulator_id: booking.simulator_id,
      start: booking.slot_start,
      end: booking.slot_end,
    }))

    return NextResponse.json({
      date,
      unavailableSlots,
      totalBookings: bookings.length,
    })
  } catch (error) {
    console.error('[v0] Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
