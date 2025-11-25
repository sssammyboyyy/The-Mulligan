"use client"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ArrowLeft, ArrowRight, Users, CalendarIcon, Clock, Check, User, Mail, Phone } from "lucide-react"
import { format, addDays, startOfToday, isToday, isTomorrow, isWeekend, getDay } from "date-fns"

const PRICING = {
  1: 250,
  2: 180,
  3: 160,
  4: 150,
} as const

// Session types with correct pricing descriptions
const SESSION_TYPES = [
  {
    id: "quick",
    title: "Quick Play",
    description: "Perfect for a quick practice session",
    minHours: 1,
    icon: Clock,
  },
  {
    id: "standard",
    title: "Standard Session",
    description: "Ideal for a full round experience",
    minHours: 2,
    icon: Users,
  },
  {
    id: "4ball",
    title: "4-Ball Special",
    description: "R150/person - 3hr minimum",
    minHours: 3,
    pricePerPerson: 150,
    players: 4,
    icon: Users,
  },
  {
    id: "3ball",
    title: "3-Ball Special",
    description: "R160/person - 3hr minimum",
    minHours: 3,
    pricePerPerson: 160,
    players: 3,
    icon: Users,
  },
]

// Operating hours by day of week
const OPERATING_HOURS: Record<number, { open: number; close: number }> = {
  0: { open: 10, close: 16 }, // Sunday
  1: { open: 9, close: 20 }, // Monday
  2: { open: 9, close: 20 }, // Tuesday
  3: { open: 9, close: 20 }, // Wednesday
  4: { open: 9, close: 20 }, // Thursday
  5: { open: 9, close: 20 }, // Friday
  6: { open: 8, close: 20 }, // Saturday
}

interface BookingFlowProps {
  onComplete?: (booking: BookingData) => void
}

interface BookingData {
  sessionType: string
  players: number
  date: Date
  timeSlot: string
  duration: number
  customerName: string
  customerEmail: string
  customerPhone: string
  golfClubRental: boolean
  coachingSession: boolean
  totalPrice: number
}

export function BookingFlow({ onComplete }: BookingFlowProps) {
  // Form state
  const [step, setStep] = useState(1)
  const [sessionType, setSessionType] = useState("")
  const [players, setPlayers] = useState(1)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [timeSlot, setTimeSlot] = useState("")
  const [duration, setDuration] = useState(1)
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [golfClubRental, setGolfClubRental] = useState(false)
  const [coachingSession, setCoachingSession] = useState(false)

  // Availability state
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)

  // Get minimum duration based on session type
  const getMinDuration = useCallback(() => {
    const session = SESSION_TYPES.find((s) => s.id === sessionType)
    return session?.minHours || 1
  }, [sessionType])

  // Calculate price
  const calculatePrice = useCallback(() => {
    const session = SESSION_TYPES.find((s) => s.id === sessionType)
    let basePrice = 0

    if (session?.pricePerPerson && session?.players) {
      // Special packages
      basePrice = session.pricePerPerson * session.players * duration
    } else {
      // Standard pricing based on player count
      const pricePerPerson = PRICING[Math.min(players, 4) as keyof typeof PRICING]
      basePrice = pricePerPerson * players * duration
    }

    // Add-ons
    if (golfClubRental) basePrice += 100
    if (coachingSession) basePrice += 450

    return basePrice
  }, [sessionType, players, duration, golfClubRental, coachingSession])

  // Generate available time slots based on operating hours
  const generateTimeSlots = useCallback((selectedDate: Date): string[] => {
    const dayOfWeek = getDay(selectedDate)
    const hours = OPERATING_HOURS[dayOfWeek]
    const slots: string[] = []

    for (let hour = hours.open; hour < hours.close; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`)
      if (hour + 0.5 < hours.close) {
        slots.push(`${hour.toString().padStart(2, "0")}:30`)
      }
    }

    return slots
  }, [])

  const availableSlots = date ? generateTimeSlots(date) : []

  // Fetch booked slots when date changes
  const fetchBookedSlots = useCallback(async (selectedDate: Date) => {
    setIsCheckingAvailability(true)
    setAvailabilityError(null)
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const response = await fetch(`/api/bookings/availability?date=${dateStr}`)
      const data = await response.json()

      if (data.bookedSlots && Array.isArray(data.bookedSlots)) {
        setBookedSlots(data.bookedSlots)
      } else {
        setBookedSlots([])
      }

      if (data.error) {
        setAvailabilityError(data.error)
      }
    } catch (error) {
      console.error("[v0] Error fetching availability:", error)
      setBookedSlots([])
      setAvailabilityError("Could not check availability")
    } finally {
      setIsCheckingAvailability(false)
    }
  }, [])

  useEffect(() => {
    if (date) {
      fetchBookedSlots(date)
    }
  }, [date, fetchBookedSlots])

  // Check if a slot is booked
  const isSlotBooked = (slot: string) => bookedSlots.includes(slot)

  // Handle session type selection
  const handleSessionSelect = (type: string) => {
    setSessionType(type)
    const session = SESSION_TYPES.find((s) => s.id === type)
    if (session?.players) {
      setPlayers(session.players)
    }
    setDuration(session?.minHours || 1)
  }

  // Get next weekend date
  const getNextWeekend = () => {
    const today = startOfToday()
    const dayOfWeek = today.getDay()
    const daysUntilSaturday = dayOfWeek === 6 ? 0 : 6 - dayOfWeek
    return addDays(today, daysUntilSaturday)
  }

  // Navigate steps
  const canProceed = () => {
    switch (step) {
      case 1:
        return sessionType !== ""
      case 2:
        return date !== undefined && timeSlot !== ""
      case 3:
        return customerName !== "" && customerEmail !== "" && customerPhone !== ""
      default:
        return false
    }
  }

  const handleNext = () => {
    if (canProceed() && step < 3) {
      setStep(step + 1)
    } else if (step === 3 && canProceed()) {
      // Complete booking
      onComplete?.({
        sessionType,
        players,
        date: date!,
        timeSlot,
        duration,
        customerName,
        customerEmail,
        customerPhone,
        golfClubRental,
        coachingSession,
        totalPrice: calculatePrice(),
      })
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  // Duration options
  const durationOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4]
  const minDuration = getMinDuration()

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 pb-24">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300",
                s < step
                  ? "bg-primary text-primary-foreground"
                  : s === step
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {s < step ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 3 && <div className={cn("w-12 h-1 mx-1 rounded", s < step ? "bg-primary" : "bg-muted")} />}
          </div>
        ))}
      </div>

      {/* Step 1: Session Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                Choose Your Session
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {SESSION_TYPES.map((session) => {
                const Icon = session.icon
                return (
                  <button
                    key={session.id}
                    onClick={() => handleSessionSelect(session.id)}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
                      "flex items-center gap-4",
                      sessionType === session.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50 hover:bg-muted/50",
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                        sessionType === session.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{session.title}</p>
                      <p className="text-sm text-muted-foreground">{session.description}</p>
                    </div>
                    {sessionType === session.id && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* Player count (for non-special sessions) */}
          {sessionType && !SESSION_TYPES.find((s) => s.id === sessionType)?.players && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Number of Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => setPlayers(num)}
                      className={cn(
                        "py-4 rounded-xl font-semibold transition-all duration-200",
                        players === num ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted hover:bg-muted/80",
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground text-center mt-3">
                  R{PRICING[Math.min(players, 4) as keyof typeof PRICING]}/person/hour
                </p>
              </CardContent>
            </Card>
          )}

          {/* Duration */}
          {sessionType && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {durationOptions
                    .filter((d) => d >= minDuration)
                    .map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={cn(
                          "px-4 py-3 rounded-xl font-medium transition-all duration-200",
                          duration === d
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : "bg-muted hover:bg-muted/80",
                        )}
                      >
                        {d}h
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 2: Date & Time Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                Select Your Date
              </CardTitle>
              <p className="text-primary-foreground/70 text-sm mt-1">Choose a date that works best for you</p>
            </CardHeader>

            <CardContent className="p-0">
              {/* Quick Date Selection */}
              <div className="p-4 border-b border-border/50 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick Select</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {[
                    { label: "Today", date: startOfToday(), check: isToday },
                    { label: "Tomorrow", date: addDays(startOfToday(), 1), check: isTomorrow },
                    {
                      label: "This Weekend",
                      date: getNextWeekend(),
                      check: (d: Date) => isWeekend(d) && d <= addDays(startOfToday(), 7),
                    },
                  ].map((option) => (
                    <button
                      key={option.label}
                      onClick={() => setDate(option.date)}
                      className={cn(
                        "flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                        "border-2 active:scale-95",
                        date && option.check(date)
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-card border-border hover:border-primary/50 hover:bg-primary/5",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="w-full"
                />
              </div>

              {/* Selected Date Display */}
              {date && (
                <div className="px-4 pb-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex flex-col items-center justify-center">
                      <span className="text-xs font-medium uppercase">{format(date, "MMM")}</span>
                      <span className="text-lg font-bold leading-none">{format(date, "d")}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{format(date, "EEEE")}</p>
                      <p className="text-sm text-muted-foreground">{format(date, "MMMM d, yyyy")}</p>
                    </div>
                    <div className="ml-auto">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Slots */}
          {date && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-secondary" />
                  </div>
                  Available Times
                </CardTitle>
                <p className="text-sm text-muted-foreground">{format(date, "EEEE, MMMM d")}</p>
                {availabilityError && <p className="text-xs text-amber-600 mt-1">Note: {availabilityError}</p>}
              </CardHeader>
              <CardContent>
                {isCheckingAvailability ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-muted-foreground">Checking availability...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => {
                      const booked = isSlotBooked(slot)
                      return (
                        <button
                          key={slot}
                          onClick={() => !booked && setTimeSlot(slot)}
                          disabled={booked}
                          className={cn(
                            "py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200",
                            "active:scale-95",
                            booked
                              ? "bg-muted/50 text-muted-foreground cursor-not-allowed line-through"
                              : timeSlot === slot
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                : "bg-card border-2 border-border hover:border-primary/50 hover:bg-primary/5",
                          )}
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Add-ons */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Optional Add-ons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => setGolfClubRental(!golfClubRental)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                  golfClubRental ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                )}
              >
                <span className="font-medium">Golf Club Rental</span>
                <span className="text-primary font-bold">+R100</span>
              </button>
              <button
                onClick={() => setCoachingSession(!coachingSession)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                  coachingSession ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                )}
              >
                <span className="font-medium">Coaching Session</span>
                <span className="text-primary font-bold">+R450</span>
              </button>
            </CardContent>
          </Card>

          {/* Price Summary */}
          <div className="bg-gradient-to-r from-primary to-primary/90 rounded-xl p-4 text-white">
            <p className="text-sm opacity-80 mb-1">Session Total</p>
            <p className="text-3xl font-bold">R{calculatePrice().toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Step 3: Contact Details */}
      {step === 3 && (
        <div className="space-y-4">
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                Your Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Smith"
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="082 123 4567"
                    className="pl-10 h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Summary */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Session</span>
                <span className="font-medium">{SESSION_TYPES.find((s) => s.id === sessionType)?.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Players</span>
                <span className="font-medium">{players}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{date ? format(date, "EEE, MMM d") : "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{timeSlot || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{duration} hours</span>
              </div>
              {golfClubRental && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Club Rental</span>
                  <span className="font-medium">R100</span>
                </div>
              )}
              {coachingSession && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coaching</span>
                  <span className="font-medium">R450</span>
                </div>
              )}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary text-lg">R{calculatePrice().toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1 h-12 bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button onClick={handleNext} disabled={!canProceed()} className="flex-1 h-12 bg-primary hover:bg-primary/90">
            {step === 3 ? "Confirm Booking" : "Continue"}
            {step < 3 && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BookingFlow
