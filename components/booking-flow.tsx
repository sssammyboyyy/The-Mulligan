"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { ArrowLeft, ArrowRight, Users, CalendarIcon, Clock, Check, Trophy, Zap, Sparkles, Loader2, Info } from "lucide-react"
import { format, addDays, startOfToday, isToday, isTomorrow, isWeekend, getDay } from "date-fns"

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
  onComplete?: (booking: any) => void
}

export function BookingFlow({ onComplete }: BookingFlowProps) {
  // --- REFS ---
  const topRef = useRef<HTMLDivElement>(null)
  const quickPlayRef = useRef<HTMLDivElement>(null)
  const timeSlotsRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  // --- STATE ---
  const [step, setStep] = useState(1)
  const [sessionType, setSessionType] = useState<"4ball" | "3ball" | "quick" | "">("")
  const [players, setPlayers] = useState(1)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [timeSlot, setTimeSlot] = useState("")
  const [duration, setDuration] = useState(1)
  
  // Add-ons
  const [golfClubRental, setGolfClubRental] = useState(false)
  const [coachingSession, setCoachingSession] = useState(false)

  // Async Data
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const [serverPrice, setServerPrice] = useState<number>(0)
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false)

  // --- AUTO SCROLL ---
  useEffect(() => {
    if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [step])

  useEffect(() => {
    if (date && timeSlotsRef.current) {
      setTimeout(() => timeSlotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
    }
  }, [date])

  // --- HANDLERS ---
  const handleSessionSelect = (type: "4ball" | "3ball" | "quick") => {
    setSessionType(type)
    if (type === "4ball") {
      setPlayers(4)
      setDuration(3)
    } else if (type === "3ball") {
      setPlayers(3)
      setDuration(3)
    } else {
      setDuration(1)
      setTimeout(() => quickPlayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 150)
    }
  }

  // --- PRICING ENGINE (SERVER SIDE) ---
  useEffect(() => {
    const fetchPrice = async () => {
      if (!sessionType) return
      setIsCalculatingPrice(true)
      
      try {
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ players, duration, sessionType })
        })
        const data = await res.json()
        
        // Add local add-ons to the server base price
        let total = Number(data.price) || 0
        if (golfClubRental) total += 100
        if (coachingSession) total += 250
        
        setServerPrice(total)
      } catch (err) {
        console.error("Pricing Error", err)
      } finally {
        setIsCalculatingPrice(false)
      }
    }

    // Debounce slightly to prevent API spam
    const timeout = setTimeout(fetchPrice, 300)
    return () => clearTimeout(timeout)
  }, [sessionType, players, duration, golfClubRental, coachingSession])


  // --- AVAILABILITY ---
  const generateTimeSlots = useCallback((selectedDate: Date): string[] => {
    const dayOfWeek = getDay(selectedDate)
    const hours = OPERATING_HOURS[dayOfWeek]
    const slots: string[] = []
    for (let hour = hours.open; hour < hours.close; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`)
      if (hour + 0.5 < hours.close) slots.push(`${hour.toString().padStart(2, "0")}:30`)
    }
    return slots
  }, [])

  const availableSlots = date ? generateTimeSlots(date) : []

  useEffect(() => {
    if (!date) return
    const fetchAvailability = async () => {
      setIsCheckingAvailability(true)
      try {
        const dateStr = format(date, "yyyy-MM-dd")
        const response = await fetch(`/api/bookings/availability?date=${dateStr}`)
        const data = await response.json()
        setBookedSlots(data.bookedSlots || [])
      } catch (e) {
        console.error(e)
      } finally {
        setIsCheckingAvailability(false)
      }
    }
    fetchAvailability()
  }, [date])

  const isSlotBooked = (slot: string) => {
    if (bookedSlots.includes(slot)) return true
    if (date && isToday(date)) {
      const now = new Date()
      const [hours, minutes] = slot.split(':').map(Number)
      const slotDate = new Date(date)
      slotDate.setHours(hours, minutes, 0, 0)
      if (slotDate <= now) return true
    }
    return false
  }

  // --- NAVIGATION ---
  const canProceed = () => {
    switch (step) {
      case 1: return sessionType !== ""
      case 2: return date !== undefined && timeSlot !== ""
      default: return false
    }
  }

  const handleNext = () => {
    if (step === 2 && canProceed()) {
      const params = new URLSearchParams({
        sessionType,
        players: players.toString(),
        date: date ? format(date, "yyyy-MM-dd") : "",
        timeSlot,
        duration: duration.toString(),
        golfClubRental: golfClubRental.toString(),
        coachingSession: coachingSession.toString(),
        totalPrice: serverPrice.toString() // Pass the verified price
      })
      window.location.href = `/booking/confirm?${params.toString()}`
    } else if (step < 2) {
      setStep(step + 1)
    }
  }

  const durationOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4]

  return (
    <div className="w-full max-w-lg mx-auto pb-32" ref={topRef}>
      {/* Header */}
      <div className="text-center mb-6 pt-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Premium Experience
        </div>
        <h1 className="text-2xl font-bold text-foreground">Book Your Session</h1>
        <p className="text-muted-foreground mt-1">
          {step === 1 ? "Step 1: Choose your game mode" : "Step 2: Select date & time"}
        </p>
      </div>

      {/* STEP 1: SESSION TYPE */}
      {step === 1 && (
        <div className="space-y-6 px-4">
          <div className="space-y-3">
            <button
              onClick={() => handleSessionSelect("4ball")}
              className={cn("w-full p-4 rounded-xl border-2 text-left transition-all", sessionType === "4ball" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50")}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">4-Ball Special (18 Holes)</span>
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">Best Value</span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">R150 pp/hr • 3 Hours • 4 Players</div>
            </button>
            
            <button
              onClick={() => handleSessionSelect("3ball")}
              className={cn("w-full p-4 rounded-xl border-2 text-left transition-all", sessionType === "3ball" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50")}
            >
              <span className="font-semibold">3-Ball Special (18 Holes)</span>
              <div className="mt-2 text-sm text-muted-foreground">R160 pp/hr • 3 Hours • 3 Players</div>
            </button>

            <button
              onClick={() => handleSessionSelect("quick")}
              className={cn("w-full p-4 rounded-xl border-2 text-left transition-all", sessionType === "quick" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50")}
            >
              <span className="font-semibold">Quick Play / Driving Range</span>
              <div className="mt-2 text-sm text-muted-foreground">Flexible • 1-4 Players</div>
            </button>
          </div>

          {/* Quick Play Options */}
          {sessionType === "quick" && (
            <div ref={quickPlayRef} className="animate-in fade-in slide-in-from-top-4 pt-4 border-t border-dashed space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Players</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(n => (
                    <button
                      key={n}
                      onClick={() => setPlayers(n)}
                      className={cn("py-2 rounded-lg border", players === n ? "bg-primary text-white border-primary" : "bg-muted/30")}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Duration (Hours)</label>
                <div className="flex flex-wrap gap-2">
                  {durationOptions.map(d => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={cn("px-4 py-2 rounded-lg border", duration === d ? "bg-primary text-white border-primary" : "bg-muted/30")}
                    >
                      {d}h
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: DATE & TIME */}
      {step === 2 && (
        <div className="space-y-4 px-4">
           <Card className="border-0 shadow-lg overflow-hidden">
             <CardHeader className="bg-primary text-primary-foreground py-4">
               <CardTitle className="text-lg flex items-center gap-2">
                 <CalendarIcon className="w-5 h-5" /> Select Date
               </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
               <Calendar
                 mode="single"
                 selected={date}
                 onSelect={setDate}
                 disabled={(d) => d < startOfToday()}
                 className="w-full p-4"
               />
             </CardContent>
           </Card>

           {date && (
             <div ref={timeSlotsRef} className="animate-in fade-in slide-in-from-bottom-4">
               <h3 className="font-semibold mb-2 flex items-center gap-2">
                 <Clock className="w-4 h-4" /> Available Slots
               </h3>
               {isCheckingAvailability ? (
                 <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
               ) : (
                 <div className="grid grid-cols-3 gap-2">
                   {availableSlots.map(slot => {
                     const booked = isSlotBooked(slot)
                     return (
                       <button
                         key={slot}
                         disabled={booked}
                         onClick={() => setTimeSlot(slot)}
                         className={cn(
                           "py-2 rounded-lg text-sm border transition-all",
                           booked ? "bg-muted text-muted-foreground line-through opacity-50 cursor-not-allowed" :
                           timeSlot === slot ? "bg-primary text-white border-primary ring-2 ring-primary ring-offset-1" :
                           "bg-card hover:border-primary"
                         )}
                       >
                         {slot}
                       </button>
                     )
                   })}
                 </div>
               )}
             </div>
           )}

           <div className="space-y-2 pt-4 border-t">
              <h3 className="font-semibold text-sm">Add-ons</h3>
              <div 
                className={cn("flex justify-between p-3 rounded-lg border cursor-pointer", golfClubRental ? "border-primary bg-primary/5" : "")}
                onClick={() => setGolfClubRental(!golfClubRental)}
              >
                <span>Full Club Set Rental</span>
                <span className="font-bold">+R100</span>
              </div>
              <div 
                className={cn("flex justify-between p-3 rounded-lg border cursor-pointer", coachingSession ? "border-primary bg-primary/5" : "")}
                onClick={() => setCoachingSession(!coachingSession)}
              >
                <span>Pro Coaching (30m)</span>
                <span className="font-bold">+R250</span>
              </div>
           </div>
        </div>
      )}

      {/* FOOTER */}
      <div ref={footerRef} className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
             <p className="text-xs text-muted-foreground uppercase font-bold">Total Estimate</p>
             {isCalculatingPrice ? (
               <Loader2 className="w-5 h-5 animate-spin text-primary" />
             ) : (
               <p className="text-2xl font-bold text-primary">R{serverPrice}</p>
             )}
          </div>
          
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Button 
              onClick={handleNext} 
              disabled={!canProceed() || isCalculatingPrice}
              className="px-8"
            >
              {step === 2 ? "Confirm" : "Next"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
