import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');

export interface ConfirmationEmailProps {
  guest_email: string;
  guest_name: string;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  player_count: number;
  simulator_id: number;
  total_price: number;
  amount_paid: number;
  addon_club_rental?: boolean;
  addon_coaching?: boolean;
}

/**
 * THE MULLIGAN: Standardized Email Dispatcher
 * Ensures 100% trigger reliability for administrative and bypass bookings.
 */
export async function sendConfirmationEmail(props: ConfirmationEmailProps) {
  const { 
    guest_email, guest_name, booking_date, start_time, 
    duration_hours, player_count, simulator_id, 
    total_price, amount_paid, addon_club_rental, addon_coaching 
  } = props;

  // 1. Skip if bypass email
  if (!guest_email || guest_email.toLowerCase().includes('walkin@venue-os.com')) {
    console.log('[RESEND SKIP]', { reason: 'walk-in email detected', email: guest_email });
    return { success: false, reason: 'walk-in_email' };
  }

  const subject = "Booking Confirmed - The Mulligan";
  console.log('[RESEND TRIGGER]', { to: guest_email, subject });

  try {
    const paidText = Number(amount_paid || 0).toFixed(2);
    const dueText = (Number(total_price || 0) - Number(amount_paid || 0)).toFixed(2);
    const bayName = simulator_id === 1 ? "Lounge Bay" : simulator_id === 2 ? "Middle Bay" : simulator_id === 3 ? "Window Bay" : "your simulator";

    const needsClubs = !!addon_club_rental;
    const needsCoaching = !!addon_coaching;

    let addOnsHtml = '';
    if (needsClubs || needsCoaching) {
      addOnsHtml = `
      <div style="background-color:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:24px;margin-bottom:32px;">
        <span style="font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;margin-bottom:15px;display:block;">✨ Selected Add-ons</span>
        <table style="width:100%;border-collapse:collapse;">
          ${needsClubs ? '<tr><td style="padding:8px 0;font-size:14px;color:#92400e;">Club Rental / Hire</td><td style="padding:8px 0;font-size:14px;color:#92400e;text-align:right;font-weight:600;">Included</td></tr>' : ''}
          ${needsCoaching ? '<tr><td style="padding:8px 0;font-size:14px;color:#92400e;">Coaching Session</td><td style="padding:8px 0;font-size:14px;color:#92400e;text-align:right;font-weight:600;">Included</td></tr>' : ''}
        </table>
      </div>`;
    }

    const html = `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;line-height:1.5;">
        <div style="background-color:#1a472a;background-image:linear-gradient(135deg,#1a472a 0%,#0d2a19 100%);padding:60px 40px;text-align:center;border-radius:12px 12px 0 0;">
          <div style="display:inline-block;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 16px;border-radius:100px;font-size:12px;font-weight:600;margin-bottom:20px;">SESSION CONFIRMED</div>
          <p style="color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;margin:0 0 8px;">The Mulligan</p>
          <p style="color:#fbbf24;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin:0 0 30px;opacity:0.9;">The Simulator Never Judges</p>
          <h1 style="color:#fff;font-size:32px;font-weight:700;margin:0;line-height:1.2;">You're Teeing Off!</h1>
          <p style="color:#a3d9a5;font-size:16px;margin:12px 0 0;opacity:0.8;">See you on the green, ${guest_name}.</p>
        </div>
        <div style="padding:40px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;background-color:#ffffff;">
          <p style="font-size:18px;color:#111827;font-weight:600;margin:0 0 16px;">Exciting news, ${guest_name}!</p>
          <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 32px;">Your booking at The Mulligan is confirmed. We've reserved ${bayName} exclusively for your group.</p>
          <div style="background-color:#f9fafb;border:1px solid #f3f4f6;border-radius:12px;padding:24px;margin-bottom:32px;">
            <span style="font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:20px;display:block;">BOOKING DETAILS</span>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#6b7280;">Date</td><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;font-weight:600;text-align:right;">${booking_date}</td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#6b7280;">Start Time</td><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;font-weight:600;text-align:right;">${start_time}</td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#6b7280;">Duration</td><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;font-weight:600;text-align:right;">${duration_hours} Hours</td></tr>
              <tr><td style="padding:12px 0;font-size:14px;color:#6b7280;">Players</td><td style="padding:12px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${player_count} Players</td></tr>
            </table>
          </div>
          ${addOnsHtml}
          <div style="background-color:#ecfdf5;border:1px solid #d1fae5;border-radius:12px;padding:24px;margin-bottom:32px;text-align:center;">
            <span style="font-size:13px;color:#065f46;opacity:0.7;margin-bottom:12px;display:block;font-weight:500;">PAYMENT CONFIRMED</span>
            <p style="font-size:28px;font-weight:700;color:#065f46;margin:0;">R ${paidText}</p>
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(6,95,70,0.1);">
              <span style="font-size:14px;color:#065f46;font-weight:500;">Balance Due at Venue: </span>
              <span style="font-size:18px;font-weight:700;color:#92400e;">R ${dueText}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "The Mulligan <bookings@themulligan.org>",
      to: guest_email,
      subject,
      html,
    });

    console.log('[RESEND RESPONSE]', { data, error });

    // Store Alert Dispatch (Optional, but good for parity)
    if (!error) {
      await resend.emails.send({
        from: "The Mulligan <alerts@themulligan.org>",
        to: "mulligan.store@gmail.com",
        subject: `BOOKING ALERT: ${guest_name}`,
        html: `<h2>New Booking Confirmed (System Relay)</h2><ul><li><strong>Guest:</strong> ${guest_name}</li><li><strong>Bay:</strong> ${bayName}</li><li><strong>Date/Time:</strong> ${booking_date} at ${start_time}</li></ul>`
      }).catch(e => console.error('[RESEND ALERT ERROR]', e.message));
    }

    return { data, error };
  } catch (err: any) {
    console.error('[RESEND FATAL ERROR]', err.message);
    return { data: null, error: err };
  }
}
