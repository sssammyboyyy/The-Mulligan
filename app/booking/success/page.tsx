import { Suspense } from "react"
import { BookingSuccess } from "@/components/booking-success"

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <BookingSuccess />
    </Suspense>
  )
}
