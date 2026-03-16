import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Using nodejs for maximum reliability with DB updates

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('[YOCO WEBHOOK] Received payload:', JSON.stringify(body, null, 2));

        const { type, payload } = body;

        // 1. Validate Webhook Type
        if (type !== 'checkout.successful') {
            console.log(`[YOCO WEBHOOK] Ignoring non-successful event: ${type}`);
            return NextResponse.json({ received: true });
        }

        const checkoutId = payload.id;
        const amount = payload.amount / 100;
        const currency = payload.currency;
        const bookingId = payload.metadata?.bookingId;

        console.log(`[YOCO WEBHOOK] Processing successful payment for Checkout: ${checkoutId}, Booking: ${bookingId}, Amount: ${amount} ${currency}`);

        if (!bookingId) {
            console.error('[YOCO WEBHOOK] Critical Error: No bookingId found in Yoco metadata!');
            return NextResponse.json({ error: 'Missing bookingId in metadata' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // 2. Fetch Booking & Idempotency Check
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (fetchError || !booking) {
            console.error(`[YOCO WEBHOOK] DB Error: Could not find booking ${bookingId}`);
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // 3. Prevent Duplicate Processing (Strict Idempotency Drop)
        // If the booking is already confirmed or the email has been sent, drop the replay
        if (booking.status === 'confirmed' || booking.email_sent === true) {
            console.log(`[Idempotency] Webhook replay detected for payment ${checkoutId} (Booking: ${bookingId}). Safely ignoring.`);
            return NextResponse.json({ 
                received: true, 
                message: 'Idempotent replay ignored' 
            }, { status: 200 });
        }

        // 4. Atomic Fulfillment Update (Code-Native)
        // We perform the state changes directly in the route, eliminating reliance on external n8n triggers for core state.
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'confirmed',
                payment_status: 'paid_online',
                amount_paid: amount,
                yoco_payment_id: checkoutId,
                email_sent: true, // Flag as sent to prevent duplicate automation if n8n is ever re-enabled
                updated_at: new Date().toISOString()
            })
            .eq('id', bookingId);

        if (updateError) {
            console.error(`[YOCO WEBHOOK] DB Update Error for booking ${bookingId}:`, updateError.message);
            return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
        }

        console.log(`[YOCO WEBHOOK] Successfully confirmed booking ${bookingId} and updated state in-house.`);

        // 5. Automation Layer (OPTIONAL/DEPRECATED - Removed n8n trigger for Core Logic)
        // Core fulfillment is now 100% code-native. Any secondary flows (SMS, etc) should also be moved here.

        return NextResponse.json({ success: true, bookingId });

    } catch (error: any) {
        console.error('[YOCO WEBHOOK] Payload Error:', error.message);
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
}
