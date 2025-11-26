"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle, Home } from "lucide-react"

function SuccessContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("bookingId")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Poll our verification endpoint to confirm payment status
    if (bookingId) {
      fetch(`/api/payment/verify?bookingId=${bookingId}`)
        .then((res) => res.json())
        .then(() => setLoading(false))
        .catch((err) => console.error(err))
    } else {
      setLoading(false)
    }
  }, [bookingId])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-600 mb-8">
          {loading ? "Finalizing your booking details..." : "We have received your booking. Check your email for details."}
        </p>
        <Link href="/">
          <Button className="w-full">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
