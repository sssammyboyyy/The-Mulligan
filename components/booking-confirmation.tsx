"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Clock, Users, Trophy, Plus, Check, Loader2 } from "lucide-react"
import Link from "next/link"

type Upsell = {
  id: string
  name: string
  description: string
  price: number
  category: string
  selected: boolean
}

export function BookingConfirmation() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [enterCompetition, setEnterCompetition] = useState(false)
  const [upsells, setUpsells] = useState<Upsell[]>([])
  const [loadingUpsells, setLoadingUpsells] = useState(true)

  // Get booking details from URL params
  const players = searchParams.get("players") || "1"
  const userType = searchParams.get("type") || "adult"
  const date = searchParams.get("date") || ""
  const time = searchParams.get("time") || ""
  const duration = searchParams.get("duration") || "1"

  // Calculate base price (simplified - would fetch from API)
  const basePrice = 450 * Number.parseFloat(duration)

  // Fetch eligible upsells from API
  useEffect(() => {
    const fetchEligibleUpsells = async () => {
      setLoadingUpsells(true)
      try {
        const response = await fetch('/api/upsells/eligible', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: new Date(date).toISOString().split('T')[0],
            time,
            duration: Number.parseFloat(duration),
            playerCount: Number.parseInt(players),
            userType,
            guestEmail: guestEmail || null
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to load upsells')
        }
        
        const data = await response.json()
        setUpsells(data.upsells.map((u: any) => ({ ...u, selected: false })))
      } catch (error) {
        console.error('Failed to load upsells:', error)
        // Gracefully fail - show no upsells instead of breaking page
        setUpsells([])
      } finally {
        setLoadingUpsells(false)
      }
    }
    
    if (date && time && duration && players) {
      fetchEligibleUpsells()
    }
  }, [date, time, duration, players, userType, guestEmail])

  const toggleUpsell = (id: string) => {
    setUpsells((prev) => prev.map((u) => (u.id === id ? { ...u, selected: !u.selected } : u)))
  }

  const selectedUpsells = upsells.filter((u) => u.selected)
  
  // Calculate price with special handling for daypart promo and referral offers
  const hasDaypartPromo = selectedUpsells.some(u => u.category === 'daypart_promo')
  const daypartPromoPrice = selectedUpsells.find(u => u.category === 'daypart_promo')?.price || 0
  const otherUpsellsTotal = selectedUpsells
    .filter(u => u.category !== 'daypart_promo' && u.category !== 'referral_offer')
    .reduce((sum, u) => sum + u.price, 0)
  const competitionFee = enterCompetition ? 50 : 0
  
  // If daypart promo selected, it replaces base price
  const totalPrice = hasDaypartPromo 
    ? daypartPromoPrice + otherUpsellsTotal + competitionFee
    : basePrice + otherUpsellsTotal + competitionFee

  const handlePayment = async () => {
    if (!guestName || !guestEmail || !guestPhone || !acceptTerms) {
      alert("Please fill in all required fields and accept the terms")
      return
    }

    setIsProcessing(true)

    // Create booking in database
    const bookingData = {
      booking_date: new Date(date).toISOString().split("T")[0],
      start_time: time,
      duration_hours: Number.parseFloat(duration),
      player_count: Number.parseInt(players),
      user_type: userType,
      base_price: hasDaypartPromo ? 0 : basePrice,
      total_price: totalPrice,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone,
      upsells: selectedUpsells,
      enter_competition: enterCompetition,
    }

    try {
      // Initialize Paystack payment
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      })

      const data = await response.json()

      if (data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url
      } else {
        throw new Error("Failed to initialize payment")
      }
    } catch (error) {
      console.error("Payment initialization error:", error)
      alert("Failed to process payment. Please try again.")
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="container mx-auto px-4">
        <Link
          href="/booking"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Booking
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
                <CardDescription>Review your session details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Players</p>
                    <p className="font-semibold text-foreground">{players} players</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold text-foreground">{new Date(date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time & Duration</p>
                    <p className="font-semibold text-foreground">
                      {time} - {duration} hour{Number.parseFloat(duration) > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <Badge className="bg-secondary text-secondary-foreground border-0 capitalize">{userType} Rate</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Upsells */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Enhance Your Experience
                </CardTitle>
                <CardDescription>Add extras to make your session even better</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingUpsells ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading available add-ons...</span>
                  </div>
                ) : upsells.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No add-ons available for this booking
                  </div>
                ) : (
                  <>
                    {upsells.map((upsell) => (
                      <div
                        key={upsell.id}
                        onClick={() => toggleUpsell(upsell.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          upsell.selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                                upsell.selected ? "bg-primary border-primary" : "border-muted-foreground"
                              }`}
                            >
                              {upsell.selected && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">{upsell.name}</p>
                              <p className="text-sm text-muted-foreground">{upsell.description}</p>
                              {upsell.category === 'daypart_promo' && upsell.selected && (
                                <Badge className="mt-2 bg-secondary text-secondary-foreground">
                                  Replaces base session price
                                </Badge>
                              )}
                              {upsell.category === 'referral_offer' && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  You'll receive a unique code via email to share with friends
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="font-semibold text-foreground ml-4">
                            {upsell.price === 0 ? 'FREE' : `R${upsell.price}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Competition Entry */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-secondary" />
                  Monthly Competition
                </CardTitle>
                <CardDescription>Enter our Longest Drive or Closest to Pin challenge</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <Checkbox id="competition" checked={enterCompetition} onCheckedChange={setEnterCompetition} />
                  <div className="flex-1">
                    <Label htmlFor="competition" className="font-semibold text-foreground cursor-pointer">
                      Enter competition for R50
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Compete for amazing prizes including R2000 Pro Shop vouchers and free sessions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guest Details */}
            <Card>
              <CardHeader>
                <CardTitle>Your Details</CardTitle>
                <CardDescription>We'll send your confirmation here</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+27 12 345 6789"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-start gap-2 pt-2">
                  <Checkbox id="terms" checked={acceptTerms} onCheckedChange={setAcceptTerms} />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    I accept the terms and conditions, including the free cancellation policy (up to 2 hours before
                    session)
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Price Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {!hasDaypartPromo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Session ({duration}h)</span>
                      <span className="font-medium text-foreground">R{basePrice.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedUpsells.filter(u => u.category !== 'referral_offer').map((upsell) => (
                    <div key={upsell.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {upsell.name}
                        {upsell.category === 'daypart_promo' && ' (Package)'}
                      </span>
                      <span className="font-medium text-foreground">R{upsell.price.toFixed(2)}</span>
                    </div>
                  ))}
                  {enterCompetition && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Competition Entry</span>
                      <span className="font-medium text-foreground">R50.00</span>
                    </div>
                  )}
                  {selectedUpsells.some(u => u.category === 'referral_offer') && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      Referral code will be included in your confirmation email
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">R{totalPrice.toFixed(2)}</span>
                </div>
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing || !acceptTerms}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                >
                  {isProcessing ? "Processing..." : "Proceed to Payment"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Secure payment powered by Paystack. We accept all major cards, Apple Pay, and Google Pay.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
