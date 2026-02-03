"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Loader2, AlertCircle, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

function SuccessContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("bookingId") || searchParams.get("reference")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const hasTriggered = useRef(false)

  useEffect(() => {
    if (!bookingId || hasTriggered.current) return

    hasTriggered.current = true

    const finalizeBooking = async () => {
      console.log(" finalizeBooking start. ID:", bookingId);
      setStatus("loading")
      setErrorMessage(null)

      try {
        console.log(" Fetching /api/trigger-n8n...");
        const res = await fetch("/api/trigger-n8n", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        })
        const data = await res.json();
        console.log(" Trigger response:", data);

        // CRITICAL FIX: Check actual success status instead of always succeeding
        if (!res.ok || data?.success === false || data?.n8n_status === "error" || data?.n8n_status?.startsWith("5")) {
          setErrorMessage(data?.message || "Failed to send confirmation. Your booking is saved, but email may be delayed.")
          setStatus("error")
          return
        }

        setStatus("success")
      } catch (e) {
        console.error("Trigger error", e)
        // CRITICAL FIX: Show error instead of hiding it
        setErrorMessage("Network error. Your booking is saved, but confirmation may be delayed.")
        setStatus("error")
      }
    }

    finalizeBooking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, retryCount])

  const handleRetry = () => {
    hasTriggered.current = false
    setRetryCount(prev => prev + 1)
  }

  if (!bookingId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">We couldn&apos;t find the booking reference.</p>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4 bg-muted/10">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg w-full">
        {status === "loading" ? (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Finalizing your booking...</h1>
            <p className="text-muted-foreground">Please wait a moment while we confirm your slot.</p>
          </div>
        ) : status === "success" ? (
          <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Booking Confirmed!</h1>
            <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-muted-foreground/30">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Booking Reference</p>
              <p className="font-mono text-xl font-bold">{bookingId.slice(0, 8).toUpperCase()}</p>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              We&apos;ve sent a confirmation email with all the details. We look forward to seeing you on the tee!
            </p>
            <div className="pt-4 flex flex-col gap-3">
              <Button asChild size="lg" className="w-full text-lg h-12">
                <Link href="/booking">Book Another Session</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" /> Back to Home
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          // ERROR STATE - CRITICAL FIX: Show actual error with retry option
          <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-amber-600" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Booking Saved!</h1>
            <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-muted-foreground/30">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Booking Reference</p>
              <p className="font-mono text-xl font-bold">{bookingId.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-sm">
              <p className="font-medium mb-1">⚠️ Confirmation Issue</p>
              <p>{errorMessage}</p>
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Don&apos;t worry - your booking is saved! If you don&apos;t receive an email within 5 minutes, please contact us.
            </p>
            <div className="pt-4 flex flex-col gap-3">
              <Button onClick={handleRetry} size="lg" className="w-full text-lg h-12" variant="outline">
                Retry Confirmation
              </Button>
              <Button asChild size="lg" className="w-full text-lg h-12">
                <Link href="/booking">Book Another Session</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" /> Back to Home
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
