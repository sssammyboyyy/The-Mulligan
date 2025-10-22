/**
 * Eligible Upsells API Endpoint
 * POST /api/upsells/eligible
 *
 * Returns only upsells that are eligible based on booking context:
 * - Evaluates trigger conditions (duration, player count, day/time, first booking)
 * - Filters out inactive upsells
 * - Sorts by priority
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  evaluateTriggerCondition,
  sortUpsellsByPriority,
  type BookingContext,
  type TriggerCondition
} from '@/lib/upsells'

interface EligibleUpsellsRequest {
  date: string          // YYYY-MM-DD
  time: string          // HH:MM
  duration: number      // Hours
  playerCount: number   // Number of players
  userType: string      // User type
  guestEmail?: string | null  // For first-time detection
}

interface UpsellResponse {
  id: string
  name: string
  description: string
  price: number
  category: string
}

interface EligibleUpsellsResponse {
  upsells: UpsellResponse[]
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: EligibleUpsellsRequest = await request.json()
    const { date, time, duration, playerCount, userType, guestEmail } = body

    // Validate required fields
    if (!date || !time || duration === undefined || playerCount === undefined || !userType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate types
    if (typeof duration !== 'number' || typeof playerCount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid field types' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient()

    // Check if this is a first-time booking
    let isFirstBooking = true

    if (guestEmail) {
      const { data: existingBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('guest_email', guestEmail)
        .eq('status', 'confirmed')
        .limit(1)

      if (bookingError) {
        console.error('Error checking existing bookings:', bookingError)
        // Continue with isFirstBooking = true on error (graceful degradation)
      } else {
        isFirstBooking = !existingBookings || existingBookings.length === 0
      }
    }

    // Create booking context for evaluation
    const context: BookingContext = {
      date,
      time,
      duration,
      playerCount,
      userType,
      isFirstBooking
    }

    // Query all active upsells
    const { data: allUpsells, error: upsellsError } = await supabase
      .from('upsells')
      .select('id, name, description, price, category, trigger_condition')
      .eq('is_active', true)

    if (upsellsError) {
      console.error('Error fetching upsells:', upsellsError)
      return NextResponse.json(
        { error: 'Failed to fetch upsells' },
        { status: 500 }
      )
    }

    // If no upsells exist, return empty array (not an error)
    if (!allUpsells || allUpsells.length === 0) {
      return NextResponse.json({ upsells: [] }, { status: 200 })
    }

    // Filter upsells based on trigger conditions
    const eligibleUpsells = allUpsells.filter(upsell => {
      const condition = upsell.trigger_condition as TriggerCondition | null
      return evaluateTriggerCondition(condition, context)
    })

    // Sort by priority
    const sortedUpsells = sortUpsellsByPriority(eligibleUpsells)

    // Map to response format (exclude trigger_condition from response)
    const responseUpsells: UpsellResponse[] = sortedUpsells.map(upsell => ({
      id: upsell.id,
      name: upsell.name,
      description: upsell.description,
      price: Number(upsell.price),
      category: upsell.category
    }))

    const response: EligibleUpsellsResponse = {
      upsells: responseUpsells
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Eligible upsells API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
