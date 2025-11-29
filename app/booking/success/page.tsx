"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, Mail, CalendarDays, ArrowRight } from "lucide-react"

function SuccessContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const email = searchParams.get("email") // If you pass email in URL, we can show it

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
        
        {/* Success Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 animate-in zoom-in duration-300">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="mb-2 text-3xl font-bold text-gray-900">Booking Confirmed!</h1>
        <p className="mb-6 text-gray-500">
          Your slot has been secured. We can't wait to see you on the tee.
        </p>

        {/* Reference Box */}
        <div className="mb-8 rounded-lg bg-gray-50 p-4 border border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Booking Reference</p>
          <p className="font-mono text-xl font-medium text-gray-800">{reference || "Loading..."}</p>
        </div>

        {/* Action Items */}
        <div className="mb-8 space-y-4 text-left">
          <div className="flex items-start gap-3">
            <Mail className="mt-1 h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Check your Email</p>
              <p className="text-sm text-gray-500">
                We sent a confirmation receipt to your inbox. 
                <span className="block mt-1 text-xs text-amber-600 font-medium">
                  (Check Spam/Junk if you don't see it within 2 minutes)
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-1 h-5 w-5 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">24h Reminder</p>
              <p className="text-sm text-gray-500">
                You will receive a reminder email with House Rules 24 hours before your slot.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Link href="/" className="block w-full">
            <Button className="w-full h-12 text-base" size="lg">
              Return to Home
            </Button>
          </Link>
          <Link href="/contact" className="block w-full">
            <Button variant="ghost" className="w-full text-gray-500">
              Need Help? Contact Us <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading confirmation...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
