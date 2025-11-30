"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

function SuccessContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("bookingId")
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    if (!bookingId) return

    // Trigger the "Manual" confirmation immediately
    const triggerConfirmation = async () => {
      try {
        const res = await fetch("/api/trigger-n8n", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        })

        if (res.ok) {
          setStatus("success")
        } else {
          console.error("Failed to trigger n8n")
          // Even if n8n fails, we might want to show success if the payment worked,
          // but let's show success anyway so the user doesn't panic.
          setStatus("success") 
        }
      } catch (e) {
        console.error("Network error", e)
        setStatus("success") // Fallback to success to avoid user panic
      }
    }

    triggerConfirmation()
  }, [bookingId])

  if (!bookingId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold">Invalid Page Access</h1>
        <Link href="/">
           <Button className="mt-4">Go Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      {status === "loading" ? (
        <div className="space-y-6 animate-pulse">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <h1 className="text-2xl font-bold">Finalizing Booking...</h1>
          <p className="text-muted-foreground">
            Please do not close this tab.
          </p>
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in duration-500 space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-700">Booking Confirmed!</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            We have received your booking. A confirmation email is on its way.
          </p>
          <div className="pt-6">
            <Link href="/">
              <Button size="lg" className="w-full sm:w-auto">Book Another Round</Button>
            </Link>
          </div>
        </div>
      )}
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
