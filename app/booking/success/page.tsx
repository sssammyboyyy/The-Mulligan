"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || searchParams.get("reference");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!bookingId) {
      setStatus("error");
      return;
    }

    const confirmBooking = async () => {
      try {
        const supabase = createClient();

        // 1. Get Booking
        const { data: booking, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .single();

        if (error || !booking) throw new Error("Booking not found");

        // 2. AUTOMATION CHECK (Critical Logic)
        // If this is a Yoco payment, n8n handles it via Webhook. We do NOTHING.
        // If this is a Coupon/Manual booking, we must trigger n8n manually.
        const isYocoPayment = booking.yoco_payment_id && booking.yoco_payment_id.startsWith("ch_");
        
        if (!isYocoPayment) {
             // It's a coupon/free booking. Trigger the email manually.
             await fetch("/api/payment/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId: booking.id }),
             });
        }

        // 3. Final Display Check
        setStatus("success");

      } catch (err) {
        console.error("Confirmation Error:", err);
        // Even if automation fails, if the user sees this page, the DB row exists.
        setStatus("success");
      }
    };

    confirmBooking();
  }, [bookingId]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-semibold">Finalizing your booking...</h2>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-600 mb-2">Booking Not Found</h2>
        <p className="mb-6 text-muted-foreground">We couldn't retrieve your booking details.</p>
        <Button asChild><Link href="/">Return Home</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      
      <h1 className="text-3xl font-bold text-foreground mb-3">Booking Confirmed!</h1>
      <p className="text-muted-foreground max-w-md mb-8 text-lg">
        Your slot has been secured. We've sent a confirmation email with all the details.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <Button asChild className="flex-1 h-12 text-base">
            <Link href="/">Book Another Slot</Link>
        </Button>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
