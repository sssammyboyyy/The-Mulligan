import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_jqTkRdoM_2Ju5NCYaRwCu31AqkbuZqpTr');

export interface ConfirmationEmailProps {
  guest_email: string;
  guest_name: string;
  guest_phone?: string;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  player_count: number;
  simulator_id: number;
  total_price: number;
  amount_paid: number;
  addon_club_rental?: boolean;
  addon_coaching?: boolean;
  addon_water_qty?: number;
  addon_gloves_qty?: number;
  addon_balls_qty?: number;
  yoco_payment_id?: string;
}

/**
 * THE MULLIGAN: Standardized Email Dispatcher
 * Ensures 100% trigger reliability with a premium, heavy dark-mode receipt aesthetic.
 */
export async function sendConfirmationEmail(props: ConfirmationEmailProps) {
  const {
    guest_email, guest_name, guest_phone, booking_date, start_time,
    duration_hours, player_count, simulator_id,
    total_price, amount_paid, addon_club_rental, addon_coaching,
    addon_water_qty, addon_gloves_qty, addon_balls_qty, yoco_payment_id
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
    const totalText = Number(total_price || 0).toFixed(2);

    // Calculate balance due securely
    const dueAmount = Math.max(0, Number(total_price || 0) - Number(amount_paid || 0));
    const dueText = dueAmount.toFixed(2);
    const balanceColor = dueAmount > 0 ? "#ef4444" : "#10b981"; // Red if debt, Green if paid

    // Dynamic Bay Styling
    let bayName = "SIMULATOR";
    let bayColor = "#ffffff";
    if (simulator_id === 1) {
      bayName = "LOUNGE BAY";
      bayColor = "#818cf8"; // Indigo
    } else if (simulator_id === 2) {
      bayName = "MIDDLE BAY";
      bayColor = "#fbbf24"; // Amber
    } else if (simulator_id === 3) {
      bayName = "WINDOW BAY";
      bayColor = "#34d399"; // Emerald
    }

    // Conditionally build Services & Inventory Table
    let inventoryHtml = '';
    const hasInventory = addon_club_rental || addon_coaching || (addon_water_qty && addon_water_qty > 0) || (addon_gloves_qty && addon_gloves_qty > 0) || (addon_balls_qty && addon_balls_qty > 0);

    if (hasInventory) {
      inventoryHtml = `
      <div style="margin-bottom: 32px;">
        <h2 style="font-size: 11px; font-weight: 900; color: #a1a1aa; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; border-bottom: 1px solid #27272a; padding-bottom: 8px;">SERVICES & INVENTORY</h2>
        <table style="width: 100%; border-collapse: collapse; color: #ffffff; font-size: 14px;">
          ${addon_club_rental ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #a1a1aa;">Club Rentals</td><td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #27272a; font-weight: 800;">INCLUDED</td></tr>` : ''}
          ${addon_coaching ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #a1a1aa;">Coaching Session</td><td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #27272a; font-weight: 800;">INCLUDED</td></tr>` : ''}
          ${(addon_water_qty && addon_water_qty > 0) ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #a1a1aa;">Water</td><td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #27272a; font-weight: 800;">x${addon_water_qty}</td></tr>` : ''}
          ${(addon_gloves_qty && addon_gloves_qty > 0) ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #a1a1aa;">Gloves</td><td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #27272a; font-weight: 800;">x${addon_gloves_qty}</td></tr>` : ''}
          ${(addon_balls_qty && addon_balls_qty > 0) ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #a1a1aa;">Balls</td><td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #27272a; font-weight: 800;">x${addon_balls_qty}</td></tr>` : ''}
        </table>
      </div>`;
    }

    const html = `
      <div style="background-color: #0a0a0a; padding: 40px 20px; font-family: 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #121212; border: 1px solid #27272a; border-radius: 16px; overflow: hidden;">
          
          <div style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #27272a; background-color: #121212;">
            <div style="font-size: 10px; font-weight: 900; color: #a1a1aa; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 16px;">VENUE OS // THE MULLIGAN</div>
            <h1 style="font-size: 28px; font-weight: 900; color: #ffffff; margin: 0; text-transform: uppercase; letter-spacing: 1px;">SESSION CONFIRMED</h1>
            <div style="margin-top: 16px; font-size: 16px; font-weight: 900; color: ${bayColor}; text-transform: uppercase; letter-spacing: 2px;">${bayName}</div>
          </div>

          <div style="padding: 40px; background-color: #121212;">
            
            <div style="margin-bottom: 32px;">
              <h2 style="font-size: 11px; font-weight: 900; color: #a1a1aa; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; border-bottom: 1px solid #27272a; padding-bottom: 8px;">SESSION DETAILS</h2>
              <table style="width: 100%; border-collapse: collapse; color: #ffffff; font-size: 14px;">
                <tr><td style="padding: 10px 0; color: #a1a1aa;">Date</td><td style="padding: 10px 0; text-align: right; font-weight: 800;">${booking_date}</td></tr>
                <tr><td style="padding: 10px 0; color: #a1a1aa;">Start Time</td><td style="padding: 10px 0; text-align: right; font-weight: 800;">${start_time}</td></tr>
                <tr><td style="padding: 10px 0; color: #a1a1aa;">Duration</td><td style="padding: 10px 0; text-align: right; font-weight: 800;">${duration_hours}H</td></tr>
                <tr><td style="padding: 10px 0; color: #a1a1aa;">Players</td><td style="padding: 10px 0; text-align: right; font-weight: 800;">${player_count}P</td></tr>
                <tr><td style="padding: 10px 0; color: #a1a1aa;">Guest Name</td><td style="padding: 10px 0; text-align: right; font-weight: 800;">${guest_name}</td></tr>
                ${guest_phone ? `<tr><td style="padding: 10px 0; color: #a1a1aa;">Contact Number</td><td style="padding: 10px 0; text-align: right; font-weight: 800;">${guest_phone}</td></tr>` : ''}
              </table>
            </div>

            ${inventoryHtml}

            <div style="background-color: #0a0a0a; border: 1px solid #27272a; border-radius: 12px; padding: 24px;">
              <h2 style="font-size: 11px; font-weight: 900; color: #a1a1aa; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; border-bottom: 1px solid #27272a; padding-bottom: 8px;">FINANCIALS</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 8px 0; color: #a1a1aa;">Total Session Value</td><td style="padding: 8px 0; text-align: right; color: #ffffff; font-weight: 800;">R ${totalText}</td></tr>
                <tr><td style="padding: 8px 0; color: #a1a1aa;">Amount Paid</td><td style="padding: 8px 0; text-align: right; color: #ffffff; font-weight: 800;">R ${paidText}</td></tr>
                <tr><td colspan="2" style="padding: 16px 0 0 0;"><div style="border-top: 1px dashed #27272a; margin-bottom: 16px;"></div></td></tr>
                <tr>
                  <td style="padding: 8px 0; color: #ffffff; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">AMOUNT DUE</td>
                  <td style="padding: 8px 0; text-align: right; color: ${balanceColor}; font-size: 20px; font-weight: 900;">R ${dueText}</td>
                </tr>
              </table>
            </div>
            
          </div>

          ${yoco_payment_id ? `
          <div style="padding: 24px 40px; background-color: #0a0a0a; border-top: 1px solid #27272a; text-align: center;">
            <div style="font-size: 10px; font-weight: 900; color: #a1a1aa; letter-spacing: 2px; text-transform: uppercase;">RECEIPT ID: ${yoco_payment_id}</div>
          </div>` : ''}
          
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

    return { data, error };
  } catch (err: any) {
    console.error('[RESEND FATAL ERROR]', err.message);
    return { data: null, error: err };
  }
}
