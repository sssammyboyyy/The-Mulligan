import { Suspense } from "react"
import BookingConfirmation from "@/components/booking-confirmation" // Default Import

export const runtime = "edge" // Force Edge for Cloudflare

export default function BookingConfirmPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg font-semibold">Loading booking details...</div>
      </div>
    }>
      <BookingConfirmation />
    </Suspense>
  )
}
