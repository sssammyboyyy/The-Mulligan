"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Calendar, Clock, Users, Mail, Home } from "lucide-react"
import Link from "next/link"

export function BookingSuccess() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference") || "N/A"

  return (
    <div className="min-h-screen py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-foreground">Booking Confirmed!</h1>
            <p className="text-lg text-muted-foreground">
              Your session is secured. We've sent a confirmation email with all the details.
            </p>
          </div>

          {/* Booking Details Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Booking Details</CardTitle>
                <Badge className="bg-primary text-primary-foreground border-0">Confirmed</Badge>
              </div>
              <CardDescription>Reference: {reference}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-semibold text-foreground text-sm">Jan 15, 2025</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-semibold text-foreground text-sm">14:00 - 16:00</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Players</p>
                    <p className="font-semibold text-foreground text-sm">2 players</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-semibold text-foreground">Check Your Email</p>
                  <p className="text-sm text-muted-foreground">
                    We've sent a confirmation with your booking details and QR code
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-semibold text-foreground">Arrive 10 Minutes Early</p>
                  <p className="text-sm text-muted-foreground">
                    Give yourself time to check in and get set up at the simulator
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-semibold text-foreground">Enjoy Your Session</p>
                  <p className="text-sm text-muted-foreground">
                    Our staff will help you get started and answer any questions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Info */}
          <Card className="mb-8 border-secondary/50 bg-secondary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground mb-1">Free Cancellation Available</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Need to reschedule? You can cancel or modify your booking free of charge up to 2 hours before your
                    session. Just use the link in your confirmation email.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="outline" className="flex-1 bg-transparent">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Button asChild className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/booking">
                <Calendar className="w-4 h-4 mr-2" />
                Book Another Session
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
