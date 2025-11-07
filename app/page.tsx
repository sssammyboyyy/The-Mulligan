import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, Trophy, Star, CheckCircle2 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/mulligan-logo.jpg" alt="The Mulligan Logo" width={50} height={50} className="object-contain" />
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold text-foreground leading-tight">The Mulligan</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                The Simulator Never Judges!
              </span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#competitions"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Competitions
            </Link>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/booking">Book Now</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-primary text-primary-foreground py-20 md:py-32">
        <div className="absolute inset-0 bg-[url('/golf-course-aerial.png')] bg-cover bg-center opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-secondary text-secondary-foreground border-0">Premium Golf Experience</Badge>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-balance">The Mulligan</h1>
            <p className="text-2xl md:text-3xl font-serif mb-6 text-secondary">The Simulator never Judges!</p>
            <p className="text-lg md:text-xl mb-8 text-primary-foreground/90 leading-relaxed">
              Book your session in seconds. Play legendary courses. Perfect your swing with cutting-edge technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base"
              >
                <Link href="/booking">Book Your Session</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                <Link href="#pricing">View Pricing</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                <span>Instant Confirmation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                <span>Free Cancellation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-foreground">Why Choose The Mulligan</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience the perfect blend of technology, comfort, and championship-level facilities
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-2 text-foreground">Real-Time Booking</h3>
                <p className="text-muted-foreground leading-relaxed">
                  See live availability and book instantly. No phone calls, no waiting. Your tee time is secured in 3
                  clicks.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-2 text-foreground">Flexible Sessions</h3>
                <p className="text-muted-foreground leading-relaxed">
                  From 1 to 4 hours, book exactly what you need. Dynamic pricing means better value during off-peak
                  times.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-2 text-foreground">Group Friendly</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Solo practice or group fun for up to 8 players. Special rates for students, juniors, and seniors.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section id="pricing" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-foreground">Transparent Pricing</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              No hidden fees. Dynamic rates reward off-peak bookings. Special discounts for students, juniors, and
              seniors.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Adult</p>
                  <p className="font-serif text-3xl font-bold text-foreground mb-1">R350-R600</p>
                  <p className="text-xs text-muted-foreground mb-4">per hour</p>
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">Off-peak: R350/hr</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">Peak: R450-R550/hr</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">Holidays: R600/hr</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Student</p>
                  <p className="font-serif text-3xl font-bold text-foreground mb-1">R280-R480</p>
                  <p className="text-xs text-muted-foreground mb-4">per hour</p>
                  <Badge className="mb-3 bg-secondary text-secondary-foreground border-0">20% Off</Badge>
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">Valid student ID</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">All time slots</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Junior</p>
                  <p className="font-serif text-3xl font-bold text-foreground mb-1">R245-R420</p>
                  <p className="text-xs text-muted-foreground mb-4">per hour</p>
                  <Badge className="mb-3 bg-secondary text-secondary-foreground border-0">30% Off</Badge>
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">Under 18 years</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">Perfect for practice</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Senior</p>
                  <p className="font-serif text-3xl font-bold text-foreground mb-1">R262-R450</p>
                  <p className="text-xs text-muted-foreground mb-4">per hour</p>
                  <Badge className="mb-3 bg-secondary text-secondary-foreground border-0">25% Off</Badge>
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">60+ years</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">Weekday specials</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-8">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/booking">Check Live Availability</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Competitions Section */}
      <section id="competitions" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-foreground">Monthly Competitions</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Test your skills and win amazing prizes. Entry included with your booking.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2 text-foreground">Longest Drive Challenge</h3>
                    <p className="text-muted-foreground mb-3 leading-relaxed">
                      Hit your longest drive and compete for the monthly championship. Winner takes home a R2000 Pro
                      Shop voucher.
                    </p>
                    <Badge className="bg-primary/10 text-primary border-0">Active Now</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2 text-foreground">Closest to the Pin</h3>
                    <p className="text-muted-foreground mb-3 leading-relaxed">
                      Show off your precision on our signature hole. Monthly winner receives a free 2-hour session.
                    </p>
                    <Badge className="bg-primary/10 text-primary border-0">Active Now</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 md:py-24 bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('/simulator-cta-bg.png')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary/60" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Ready to Tee Off?</h2>
          <p className="text-lg mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Book your session now and experience the future of golf. Instant confirmation, flexible cancellation.
          </p>
          <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base">
            <Link href="/booking">Book Your Session Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/mulligan-logo.jpg"
                alt="The Mulligan Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold text-foreground leading-tight">The Mulligan</span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
                  The Simulator Never Judges!
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 The Mulligan. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
