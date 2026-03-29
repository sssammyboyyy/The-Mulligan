import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    // 1. Fetch the booking to get the Yoco ID
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 2. Idempotency Check
    if (booking.payment_status === 'paid_online' || booking.status === 'completed') {
      return NextResponse.json({ success: true, message: 'Already verified' });
    }

    if (!booking.yoco_payment_id) {
      return NextResponse.json({ error: 'No Yoco ID attached to booking' }, { status: 400 });
    }

    // 3. Verify directly with Yoco Checkout API
    const yocoRes = await fetch(`https://payments.yoco.com/api/checkouts/${booking.yoco_payment_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.YOCO_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!yocoRes.ok) {
      const errorBody = await yocoRes.text();
      console.error("[YOCO_VERIFY_ERROR]", errorBody);
      return NextResponse.json({ error: 'Failed to reach Yoco' }, { status: 500 });
    }

    const yocoData = await yocoRes.json();

    // 4. Reconcile the Ledger
    if (yocoData.status === 'paid' || yocoData.status === 'succeeded') {
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ 
          payment_status: 'paid_online',
          status: 'confirmed',
          amount_paid: (yocoData.amount || 0) / 100,
          payment_verified_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (updateError) throw updateError;
      
      console.log(`[VERIFY_SUCCESS] Booking ${bookingId} marked as paid.`);
      return NextResponse.json({ success: true, status: yocoData.status });
    }

    // Still pending or failed
    return NextResponse.json({ success: false, status: yocoData.status });

  } catch (error: any) {
    console.error("[VERIFY_FATAL]", error.message);
    return NextResponse.json({ error: 'Internal Verification Error' }, { status: 500 });
  }
}
