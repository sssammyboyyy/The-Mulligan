import { Suspense } from "react"
import { BookingConfirmation } from "@/components/booking-confirmation"

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <BookingConfirmation />
    </Suspense>
  )
}
