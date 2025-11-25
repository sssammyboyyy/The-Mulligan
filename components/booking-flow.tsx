"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format, addDays, isSameDay, getDay } from "date-fns"
import { CalendarIcon, Clock, Users, ChevronLeft, ChevronRight, Sparkles, Check, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { createClient } from "@/lib/supabase/client"

// Pricing structure: 1 person = R250, 2 = R180 each, 3 = R160 each, 4+ = R150 each
const PRICING = {
  1: 250,
  2: 180,
  3: 160,
  4: 150,
}

const getPricePerPerson = (players: number): number => {
  if (players >= 4) return PRICING[4]
  return PRICING[players as keyof typeof PRICING] || PRICING[1]
}

// Operating hours based on day
const getOperatingHours = (date: Date) => {
  const day = getDay(date)
  if (day === 0) return { start: 10, end: 16 } // Sunday
  if (day === 6) return { start: 8, end: 20 } // Saturday
  return { start: 9, end: 20 } // Monday-Friday
}

// Generate time slots based on operating hours
const generateTimeSlots = (date: Date) => {
  const { start, end } = getOperatingHours(date)
  const slots: string[] = []
  for (let hour = start; hour < end; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`)
    slots.push(`${hour.toString().padStart(2, "0")}:30`)
  }
  return slots
}

// Duration options in hours
const DURATION_OPTIONS = [1, 1.5, 2, 2.5, 3]

// Session types
const SESSION_TYPES = [
  {
    id: "quick",
    name: "Quick Play",
    description: "Jump in for a quick session",
    icon: Zap,
    color: "text-blue-500",
  },
  {
    id: "special",
    name: "Ball Specials",
    description: "Great rates for groups",
    icon: Sparkles,
    color: "text-amber-500",
  },
]

export function BookingFlow() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [sessionType, setSessionType] = useState<string>("")
  const [players, setPlayers] = useState(1)
  const [duration, setDuration] = useState(1)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [timeSlot, setTimeSlot] = useState<string>("")
  const [golfClubRental, setGolfClubRental] = useState(false)
  const [coaching, setCoaching] = useState(false)
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const [bookedSlots, setBookedSlots] = useState<string[]>([])

  // Calculate pricing
  const pricePerPerson = getPricePerPerson(players)
  const basePrice = pricePerPerson * players * duration
  const addonsPrice = (golfClubRental ? 100 : 0) + (coaching ? 450 : 0)
  const totalPrice = basePrice + addonsPrice
  const deposit = Math.ceil(totalPrice * 0.5)

  // Get available time slots for selected date
  const availableSlots = useMemo(() => {
    if (!date) return []
    return generateTimeSlots(date)
  }, [date])

  // Check booked slots when date changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (!date) return
      setIsCheckingAvailability(true)
      try {
        const supabase = createClient()
        const dateStr = format(date, "yyyy-MM-dd")
        const { data } = await supabase
          .from("bookings")
          .select("time_slot, duration")
          .eq("booking_date", dateStr)
          .in("status", ["confirmed", "pending"])

        if (data) {
          const blocked: string[] = []
          data.forEach((booking) => {
            const [hours, minutes] = booking.time_slot.split(":").map(Number)
            const slots = Math.ceil(booking.duration * 2)
            for (let i = 0; i < slots; i++) {
              const slotMinutes = hours * 60 + minutes + i * 30
              const h = Math.floor(slotMinutes / 60)
              const m = slotMinutes % 60
              blocked.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
            }
          })
          setBookedSlots(blocked)
        }
      } catch (error) {
        console.error("Error checking availability:", error)
      } finally {
        setIsCheckingAvailability(false)
      }
    }
    checkAvailability()
  }, [date])

  const isSlotBooked = useCallback((slot: string) => bookedSlots.includes(slot), [bookedSlots])

  // Navigate to confirmation
  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1)
    } else if (date && timeSlot) {
      const params = new URLSearchParams({
        players: players.toString(),
        duration: duration.toString(),
        date: format(date, "yyyy-MM-dd"),
        time: timeSlot,
        sessionType,
        golfClubRental: golfClubRental.toString(),
        coaching: coaching.toString(),
      })
      router.push(`/booking/confirm?${params.toString()}`)
    }
  }

  const canContinue = () => {
    if (step === 1) return sessionType !== ""
    if (step === 2) return players > 0 && duration > 0
    if (step === 3) return date && timeSlot
    return false
  }

  // Quick date selection helpers
  const quickDates = [
    { label: "Today", date: new Date() },
    { label: "Tomorrow", date: addDays(new Date(), 1) },
    { label: "This Weekend", date: addDays(new Date(), (6 - getDay(new Date()) + 7) % 7 || 7) },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="max-w-lg mx-auto px-4 py-6 pb-32">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Book Your Bay</h1>
          <p className="text-sm text-muted-foreground mt-1">Step {step} of 3</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Step 1: Session Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Choose Session Type</h2>
            <div className="space-y-3">
              {SESSION_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => setSessionType(type.id)}
                    className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                      sessionType === type.id
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                        : "border-border hover:border-primary/50 bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-muted ${type.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{type.name}</h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                      {sessionType === type.id && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Pricing Info */}
            <Card className="mt-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3 text-foreground">Group Pricing</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between p-2 rounded-lg bg-background/60">
                    <span className="text-muted-foreground">Solo</span>
                    <span className="font-bold text-foreground">R250/hr</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-background/60">
                    <span className="text-muted-foreground">Pair</span>
                    <span className="font-bold text-foreground">R180/hr each</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-background/60">
                    <span className="text-muted-foreground">Trio</span>
                    <span className="font-bold text-secondary">R160/hr each</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-background/60">
                    <span className="text-muted-foreground">4+ Players</span>
                    <span className="font-bold text-foreground">R150/hr each</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Players & Duration */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Player Selection */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                How many players?
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setPlayers(num)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                      players === num
                        ? "border-primary bg-primary text-primary-foreground shadow-lg"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <div className="text-2xl font-bold">{num}</div>
                    <div className="text-xs mt-1 opacity-80">R{getPricePerPerson(num)}/hr</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Selection */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Session Duration
              </h2>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`px-4 py-3 rounded-xl border-2 font-medium transition-all duration-200 ${
                      duration === d
                        ? "border-primary bg-primary text-primary-foreground shadow-lg"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    {d} {d === 1 ? "hour" : "hours"}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Price Preview */}
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Total</p>
                    <p className="text-2xl font-bold text-foreground">R{basePrice}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {players} {players === 1 ? "player" : "players"} × {duration}hr × R{pricePerPerson}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Date & Time - PREMIUM REDESIGN */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Quick Date Selection */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Select Date
              </h2>
              <div className="flex gap-2 mb-4">
                {quickDates.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => setDate(q.date)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      date && isSameDay(date, q.date)
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Premium Calendar Card */}
            <Card className="overflow-hidden border-2 border-primary/10 shadow-xl">
              <CardContent className="p-3 sm:p-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Time Slots */}
            {date && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Available Times
                </h2>
                <p className="text-sm text-muted-foreground mb-4">{format(date, "EEEE, MMMM d, yyyy")}</p>

                {isCheckingAvailability ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-muted-foreground">Checking availability...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {availableSlots.map((slot) => {
                      const booked = isSlotBooked(slot)
                      return (
                        <button
                          key={slot}
                          onClick={() => !booked && setTimeSlot(slot)}
                          disabled={booked}
                          className={`py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            booked
                              ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed line-through"
                              : timeSlot === slot
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                                : "bg-card border border-border hover:border-primary/50 hover:bg-primary/5"
                          }`}
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Add-ons */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Optional Add-ons</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setGolfClubRental(!golfClubRental)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                    golfClubRental
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {golfClubRental && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <span className="font-medium">Golf Club Rental</span>
                  </div>
                  <span className="text-primary font-bold">+R100</span>
                </button>

                <button
                  onClick={() => setCoaching(!coaching)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                    coaching ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {coaching && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <span className="font-medium">Professional Coaching</span>
                  </div>
                  <span className="text-primary font-bold">+R450</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border p-4 safe-area-inset-bottom">
          <div className="max-w-lg mx-auto">
            {/* Price Summary (show on step 2 and 3) */}
            {step >= 2 && (
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="text-muted-foreground">Total: R{totalPrice}</span>
                <span className="font-semibold text-primary">Deposit: R{deposit}</span>
              </div>
            )}

            <div className="flex gap-3">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 h-12 rounded-xl">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                onClick={handleContinue}
                disabled={!canContinue()}
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25"
              >
                {step === 3 ? "Continue to Payment" : "Next"}
                {step < 3 && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingFlow
