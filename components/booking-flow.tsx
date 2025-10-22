"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Clock, CalendarIcon, Trophy } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type UserType = "adult" | "student" | "junior" | "senior"

export function BookingFlow() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [playerCount, setPlayerCount] = useState<number>(1)
  const [userType, setUserType] = useState<UserType>("adult")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [timeSlot, setTimeSlot] = useState<string>("")
  const [duration, setDuration] = useState<number>(1)

  const handleContinue = () => {
    if (step === 1 && playerCount > 0) {
      setStep(2)
    } else if (step === 2 && userType) {
      setStep(3)
    } else if (step === 3 && date && timeSlot && duration) {
      // Navigate to confirmation page with booking details
      router.push(
        `/booking/confirm?players=${playerCount}&type=${userType}&date=${date.toISOString()}&time=${timeSlot}&duration=${duration}`,
      )
    }
  }

  const canContinue = () => {
    if (step === 1) return playerCount > 0
    if (step === 2) return userType !== ""
    if (step === 3) return date && timeSlot && duration
    return false
  }

  // Sample time slots (would be fetched from API based on date)
  const timeSlots = [
    { time: "06:00", available: true, isPeak: false, price: 350 },
    { time: "08:00", available: true, isPeak: false, price: 350 },
    { time: "10:00", available: true, isPeak: false, price: 350 },
    { time: "12:00", available: true, isPeak: true, price: 450 },
    { time: "14:00", available: true, isPeak: true, price: 450 },
    { time: "16:00", available: true, isPeak: true, price: 450 },
    { time: "18:00", available: true, isPeak: true, price: 400 },
    { time: "20:00", available: false, isPeak: true, price: 400 },
  ]

  return (
    <div className="min-h-screen py-8">
      {/* Header */}
      <div className="container mx-auto px-4 mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Book Your Session</h1>
        </div>
        <p className="text-muted-foreground">Complete your booking in 3 simple steps</p>
      </div>

      {/* Progress Indicator */}
      <div className="container mx-auto px-4 mb-8">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 mx-2 ${s < step ? "bg-secondary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between max-w-2xl mx-auto mt-2">
          <span className="text-xs text-muted-foreground">Players</span>
          <span className="text-xs text-muted-foreground">Type</span>
          <span className="text-xs text-muted-foreground">Date & Time</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Player Count */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  How many players?
                </CardTitle>
                <CardDescription>Select the number of players for your session (max 8)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                    <Button
                      key={count}
                      variant={playerCount === count ? "default" : "outline"}
                      className={playerCount === count ? "bg-primary text-primary-foreground" : ""}
                      onClick={() => setPlayerCount(count)}
                    >
                      {count}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: User Type */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Select player type</CardTitle>
                <CardDescription>Choose the category that applies to get the right pricing</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={userType} onValueChange={(value) => setUserType(value as UserType)}>
                  <div className="space-y-3">
                    <Label
                      htmlFor="adult"
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="adult" id="adult" />
                        <div>
                          <p className="font-semibold text-foreground">Adult</p>
                          <p className="text-sm text-muted-foreground">Standard pricing</p>
                        </div>
                      </div>
                      <span className="font-semibold text-foreground">R350-R600/hr</span>
                    </Label>
                    <Label
                      htmlFor="student"
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="student" id="student" />
                        <div>
                          <p className="font-semibold text-foreground">Student</p>
                          <p className="text-sm text-muted-foreground">Valid student ID required</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-secondary text-secondary-foreground border-0 mb-1">20% Off</Badge>
                        <p className="font-semibold text-foreground">R280-R480/hr</p>
                      </div>
                    </Label>
                    <Label
                      htmlFor="junior"
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="junior" id="junior" />
                        <div>
                          <p className="font-semibold text-foreground">Junior</p>
                          <p className="text-sm text-muted-foreground">Under 18 years</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-secondary text-secondary-foreground border-0 mb-1">30% Off</Badge>
                        <p className="font-semibold text-foreground">R245-R420/hr</p>
                      </div>
                    </Label>
                    <Label
                      htmlFor="senior"
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="senior" id="senior" />
                        <div>
                          <p className="font-semibold text-foreground">Senior</p>
                          <p className="text-sm text-muted-foreground">60+ years</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-secondary text-secondary-foreground border-0 mb-1">25% Off</Badge>
                        <p className="font-semibold text-foreground">R262-R450/hr</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    Select date
                  </CardTitle>
                  <CardDescription>Choose your preferred date (up to 30 days ahead)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const maxDate = new Date()
                      maxDate.setDate(maxDate.getDate() + 30)
                      return date < today || date > maxDate
                    }}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              {date && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Select time slot
                      </CardTitle>
                      <CardDescription>
                        <Badge className="bg-secondary/20 text-secondary border-0 mr-2">Peak</Badge>
                        Higher demand times
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {timeSlots.map((slot) => (
                          <Button
                            key={slot.time}
                            variant={timeSlot === slot.time ? "default" : "outline"}
                            className={`flex flex-col h-auto py-3 ${
                              timeSlot === slot.time ? "bg-primary text-primary-foreground" : ""
                            }`}
                            disabled={!slot.available}
                            onClick={() => setTimeSlot(slot.time)}
                          >
                            <span className="font-semibold">{slot.time}</span>
                            <span className="text-xs mt-1">R{slot.price}/hr</span>
                            {slot.isPeak && (
                              <Badge className="mt-1 bg-secondary/20 text-secondary border-0 text-[10px] px-1 py-0">
                                Peak
                              </Badge>
                            )}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Session duration</CardTitle>
                      <CardDescription>How long would you like to play? (1-4 hours)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 hour</SelectItem>
                          <SelectItem value="1.5">1.5 hours</SelectItem>
                          <SelectItem value="2">2 hours</SelectItem>
                          <SelectItem value="2.5">2.5 hours</SelectItem>
                          <SelectItem value="3">3 hours</SelectItem>
                          <SelectItem value="3.5">3.5 hours</SelectItem>
                          <SelectItem value="4">4 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                Back
              </Button>
            )}
            <Button
              onClick={handleContinue}
              disabled={!canContinue()}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {step === 3 ? "Continue to Checkout" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
