'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#Fdfbf7] flex items-center justify-center font-sans">Loading...</div>}>
      <BookingSuccessContent />
    </Suspense>
  );
}

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId') || searchParams.get('reference') || searchParams.get('booking_id');

  return (
    <div className="min-h-screen bg-[#Fdfbf7] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center space-y-6">

        <div className="space-y-4 animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Booking Received!</h1>
          <p className="text-[#4A4A4A] leading-relaxed">
            Your booking details have been received and your bay is reserved. We&apos;ve emailed you the initial confirmation.
          </p>
          
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
             <p className="text-sm text-blue-700 font-medium">
               Please note: Your booking is currently pending final bank settlement. Our staff will confirm your bay shortly.
             </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col gap-3">
            <Link
              href="/booking"
              className="bg-[#1A1A1A] text-white px-8 py-3 rounded-full font-medium hover:bg-black transition-colors"
            >
              Book Another Session
            </Link>
            <Link
              href="/"
              className="border border-gray-200 text-[#4A4A4A] px-8 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
