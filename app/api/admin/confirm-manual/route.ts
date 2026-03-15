import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logEvent } from '@/lib/utils';

export const runtime = 'edge';

/**
 * API route for manually confirming a booking from the admin dashboard.
 * This provides a safe, controlled way to handle in-store payments or
 * other manual overrides, ensuring the n8n automation workflow is always triggered.
 */
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { bookingId, pin, amountPaid, paymentMethod = 'instore' } = body;

    const adminPin = process.env.ADMIN_PIN || "8821";
    const n8nUrl = process.env.N8N_WEBHOOK_URL;

    // 1. Authorization: Must provide the correct admin PIN
    if (pin !== adminPin) {
        logEvent('manual_confirm_unauthorized', { bookingId }, 'warn');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validation: Ensure required parameters are present
    if (!bookingId || !n8nUrl) {
        const missing = !bookingId ? 'bookingId' : 'N8N_WEBHOOK_URL';
        logEvent('manual_confirm_validation_failed', { missing }, 'error');
        return NextResponse.json({ error: `Missing required parameter: ${missing}` }, { status: 400 });
    }

    try {
        // 3. Update Booking: Set status to confirmed and log payment details
        const { data: updatedBooking, error: updateError } = await supabaseAdmin
            .from('bookings')
            .update({
                status: 'confirmed',
                payment_status: paymentMethod,
                amount_paid: amountPaid, // Use the amount provided by the admin
                confirmed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', bookingId)
            .select()
            .single();

        if (updateError) {
            logEvent('manual_confirm_db_update_failed', { bookingId, error: updateError.message }, 'error');
            throw new Error(`Failed to update booking: ${updateError.message}`);
        }

        logEvent('manual_confirm_success', { bookingId });

        // 4. Trigger Automation: Explicitly call the n8n webhook with all necessary data
        // This is the crucial step that connects the manual action to the automation pipeline.
        const n8nAdminSecret = process.env.N8N_ADMIN_SECRET;
        if (!n8nAdminSecret) throw new Error("N8N_ADMIN_SECRET is not configured.");

        await fetch(n8nUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bookingId: updatedBooking.id,
                secret: n8nAdminSecret
            })
        });

        logEvent('manual_confirm_n8n_triggered', { bookingId });

        return NextResponse.json({ success: true, message: 'Booking confirmed and automation triggered.', booking: updatedBooking });

    } catch (error: any) {
        logEvent('manual_confirm_error', { bookingId, error: error.message }, 'error');
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}