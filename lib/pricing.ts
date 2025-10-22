/**
 * Pricing Helper Utilities
 * Shared functions for determining day types and pricing calculations
 */

import type { DayType } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Determine if a date is a weekday, weekend, or holiday
 * @param date - The date to check
 * @param holidays - Array of holiday dates
 * @returns DayType - 'weekday' | 'weekend' | 'holiday'
 */
export function getDayType(date: Date, holidays: Date[] = []): DayType {
  // Check if date matches any holiday
  const dateStr = date.toISOString().split('T')[0]
  const isHoliday = holidays.some(holiday => {
    const holidayStr = holiday.toISOString().split('T')[0]
    return holidayStr === dateStr
  })

  if (isHoliday) {
    return 'holiday'
  }

  // Get day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = date.getDay()

  // Weekend: Saturday (6) or Sunday (0)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 'weekend'
  }

  // Otherwise it's a weekday
  return 'weekday'
}

/**
 * Check if a specific date is a holiday in the database
 * @param date - The date to check
 * @param supabaseClient - Supabase client instance
 * @returns Promise<boolean> - True if date is a holiday
 */
export async function isDateHoliday(
  date: Date,
  supabaseClient: SupabaseClient
): Promise<boolean> {
  const dateStr = date.toISOString().split('T')[0]

  const { data, error } = await supabaseClient
    .from('holidays')
    .select('date')
    .eq('date', dateStr)
    .limit(1)

  if (error) {
    console.error('Error checking holiday:', error)
    return false
  }

  return data && data.length > 0
}

/**
 * Get all holidays in a date range from the database
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param supabaseClient - Supabase client instance
 * @returns Promise<Date[]> - Array of holiday dates
 */
export async function getHolidaysForDateRange(
  startDate: Date,
  endDate: Date,
  supabaseClient: SupabaseClient
): Promise<Date[]> {
  const startStr = startDate.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]

  const { data, error } = await supabaseClient
    .from('holidays')
    .select('date')
    .gte('date', startStr)
    .lte('date', endStr)

  if (error) {
    console.error('Error fetching holidays:', error)
    return []
  }

  // Convert date strings to Date objects
  return (data || []).map(row => new Date(row.date))
}

/**
 * Determine if a time is considered peak based on day type and hour
 * @param dayType - The day type (weekday, weekend, holiday)
 * @param hour - The hour (0-23)
 * @returns boolean - True if the time is peak
 */
export function isPeakTime(dayType: DayType, hour: number): boolean {
  if (dayType === 'holiday') {
    // Holidays are peak all day
    return true
  }

  if (dayType === 'weekend') {
    // Weekends: 10:00-21:00 are peak
    return hour >= 10 && hour < 21
  }

  // Weekdays: 16:00-21:00 are peak
  return hour >= 16 && hour < 21
}

/**
 * Format price for display
 * @param price - Price in rands
 * @returns string - Formatted price with R prefix
 */
export function formatPrice(price: number): string {
  return `R${price.toFixed(2)}`
}

/**
 * Calculate total price for a booking
 * @param pricePerHour - Price per hour
 * @param durationHours - Duration in hours
 * @returns number - Total price
 */
export function calculateBookingPrice(
  pricePerHour: number,
  durationHours: number
): number {
  return pricePerHour * durationHours
}

/**
 * Apply user type discount to base price
 * @param basePrice - Base adult price
 * @param userType - User type (adult, student, junior, senior)
 * @returns number - Discounted price
 */
export function applyUserTypeDiscount(
  basePrice: number,
  userType: 'adult' | 'student' | 'junior' | 'senior'
): number {
  const discounts = {
    adult: 1.0,      // No discount
    student: 0.80,   // 20% off
    junior: 0.70,    // 30% off
    senior: 0.75     // 25% off
  }

  return basePrice * discounts[userType]
}

/**
 * Validate that a date is within the allowed booking window
 * @param date - Date to check
 * @returns { valid: boolean, error?: string }
 */
export function validateBookingDate(date: Date): { valid: boolean; error?: string } {
  const now = new Date()
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)

  // Check if date is in the past
  if (date < now) {
    return {
      valid: false,
      error: 'Cannot book dates in the past'
    }
  }

  // Check if date is more than 30 days ahead
  if (date > maxDate) {
    return {
      valid: false,
      error: 'Cannot book more than 30 days in advance'
    }
  }

  return { valid: true }
}

/**
 * Parse time string to hour number
 * @param timeStr - Time string in HH:MM format
 * @returns number - Hour (0-23)
 */
export function parseTimeToHour(timeStr: string): number {
  const [hourStr] = timeStr.split(':')
  return parseInt(hourStr, 10)
}

/**
 * Format date for display
 * @param date - Date to format
 * @returns string - Formatted date
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format time for display
 * @param timeStr - Time string in HH:MM format
 * @returns string - Formatted time
 */
export function formatTime(timeStr: string): string {
  const [hour, minute] = timeStr.split(':')
  const hourNum = parseInt(hour, 10)
  const ampm = hourNum >= 12 ? 'PM' : 'AM'
  const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
  return `${displayHour}:${minute} ${ampm}`
}
