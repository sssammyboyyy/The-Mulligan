import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Validates the Yoco webhook signature using the Web Crypto API.
 */
async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const dataToSign = encoder.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = new Uint8Array(
      signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );

    return await crypto.subtle.verify('HMAC', cryptoKey, signatureBytes, dataToSign);
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Native email dispatch using standard Edge-compatible fetch
 */
async function sendConfirmationEmail(customerEmail: string, bookingRef: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'The Mulligan <bookings@themulligan.co.za>',
        to: customerEmail,
        subject: `Booking Confirmed - ${bookingRef}`,
        html: `<p>Your payment was successful. Your booking reference is <strong>${bookingRef}</strong>. See you on the tee!</p>`
      })
    });

    if (!res.ok) {
      console.error('Failed to dispatch email:', await res.text());
    }
  } catch (error) {
    console.error('Email dispatch error:', error);
  }
}

export async function POST(req: Request) {
  try {
    // 1. Extract headers & validate presence
    const signatureHeader = req.headers.get('webhook-signature') || req.headers.get('yoco-signature');
    const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;

    if (!signatureHeader || !webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized: Missing credentials' }, { status: 401 });
    }

    // 2. Read raw body text for cryptographic validation
    const rawBody = await req.text();

    // 3. Cryptographic Integrity Check
    const isValid = await verifySignature(rawBody, signatureHeader, webhookSecret);
    if (!isValid) {
      return NextResponse.json({ error: 'Forbidden: Invalid Signature' }, { status: 403 });
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.type;

    if (eventType !== 'payment.succeeded' && eventType !== 'payment.created') {
      return NextResponse.json({ received: true, status: 'ignored_event' }, { status: 200 });
    }

    const paymentData = payload.payload;
    const yocoPaymentId = paymentData.id;
    const metadata = paymentData.metadata || {};
    const bookingRequestId = metadata.booking_request_id || metadata.checkoutId;
    const customerEmail = metadata.customer_email || 'client@example.com'; 

    if (!bookingRequestId) {
      console.error('Missing booking reference in metadata');
      return NextResponse.json({ error: 'Bad Request: Missing metadata' }, { status: 400 });
    }

    // 4. The Idempotency Gate
    const { data: existingRecord, error: fetchError } = await supabase
      .from('bookings') // Adjust to your specific table (transactions/bookings)
      .select('payment_status')
      .eq('id', bookingRequestId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Database query error:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingRecord?.payment_status === 'completed') {
      console.log(`Idempotency hit: Booking ${bookingRequestId} already completed. Dropping request.`);
      return NextResponse.json({ received: true, message: 'Already processed' }, { status: 200 });
    }

    // 5. Atomic State Mutation
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        payment_status: 'completed',
        yoco_payment_id: yocoPaymentId,
        amount_paid: paymentData.amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingRequestId);

    if (updateError) {
      console.error('Atomic mutation failed:', updateError);
      return NextResponse.json({ error: 'Failed to update ledger' }, { status: 500 });
    }

    // 6. Code-Native Dispatch (Email)
    await sendConfirmationEmail(customerEmail, bookingRequestId);

    // 7. Acknowledge receipt to Yoco to stop retries
    return NextResponse.json({ received: true, status: 'success' }, { status: 200 });

  } catch (error: any) {
    console.error('Edge Webhook Exception:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
