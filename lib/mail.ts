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
 * ADMIN RECEIPT: Standardized Store Notification
 * Heavy dark-mode aesthetic for venue management.
 */
export async function sendStoreReceiptEmail(props: ConfirmationEmailProps) {
  const { 
    guest_name, guest_phone, booking_date, start_time, 
    duration_hours, player_count, simulator_id, 
    total_price, amount_paid, addon_club_rental, addon_coaching,
    addon_water_qty, addon_gloves_qty, addon_balls_qty, yoco_payment_id
  } = props;

  const adminEmail = "mulligan.store@gmail.com";
  const subject = `STORE ALERT: ${guest_name} - Session Confirmed`;
  console.log('[RESEND ADMIN TRIGGER]', { to: adminEmail, subject });

  try {
    const paidText = Number(amount_paid || 0).toFixed(2);
    const totalText = Number(total_price || 0).toFixed(2);
    const dueAmount = Math.max(0, Number(total_price || 0) - Number(amount_paid || 0));
    const dueText = dueAmount.toFixed(2);
    const balanceColor = dueAmount > 0 ? "#ef4444" : "#10b981";

    let bayName = "SIMULATOR";
    let bayColor = "#ffffff";
    if (simulator_id === 1) { bayName = "LOUNGE BAY"; bayColor = "#818cf8"; }
    else if (simulator_id === 2) { bayName = "MIDDLE BAY"; bayColor = "#fbbf24"; }
    else if (simulator_id === 3) { bayName = "WINDOW BAY"; bayColor = "#34d399"; }

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
      <div style="background-color: #0a0a0a; padding: 40px 20px; font-family: 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #121212; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; padding: 40px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 10px; font-weight: 900; color: #a1a1aa; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 16px;">ADMIN ALERT // THE MULLIGAN</div>
            <h1 style="font-size: 28px; font-weight: 900; color: #ffffff; margin: 0; text-transform: uppercase;">BOOKING RECEIVED</h1>
            <div style="margin-top: 16px; font-size: 18px; font-weight: 900; color: ${bayColor}; text-transform: uppercase;">${bayName}</div>
          </div>
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 11px; font-weight: 900; color: #a1a1aa; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #27272a; padding-bottom: 8px;">GUEST INFO</h2>
            <table style="width: 100%; color: #ffffff; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #a1a1aa;">Name</td><td style="padding: 8px 0; text-align: right; font-weight: 800;">${guest_name}</td></tr>
              ${guest_phone ? `<tr><td style="padding: 8px 0; color: #a1a1aa;">Phone</td><td style="padding: 8px 0; text-align: right; font-weight: 800;">${guest_phone}</td></tr>` : ''}
              <tr><td style="padding: 8px 0; color: #a1a1aa;">Date</td><td style="padding: 8px 0; text-align: right; font-weight: 800;">${booking_date}</td></tr>
              <tr><td style="padding: 8px 0; color: #a1a1aa;">Time</td><td style="padding: 8px 0; text-align: right; font-weight: 800;">${start_time} (${duration_hours}H)</td></tr>
            </table>
          </div>
          ${inventoryHtml}
          <div style="background-color: #0a0a0a; border: 1px solid #27272a; border-radius: 12px; padding: 24px;">
            <table style="width: 100%; font-size: 14px;">
              <tr><td style="color: #a1a1aa;">Total Value</td><td style="text-align: right; color: #ffffff; font-weight: 800;">R ${totalText}</td></tr>
              <tr><td style="color: #a1a1aa;">Amount Paid</td><td style="text-align: right; color: #ffffff; font-weight: 800;">R ${paidText}</td></tr>
              <tr style="font-size: 18px; font-weight: 900;"><td style="color: #ffffff; padding-top: 12px;">OUTSTANDING</td><td style="text-align: right; color: ${balanceColor}; padding-top: 12px;">R ${dueText}</td></tr>
            </table>
          </div>
          ${yoco_payment_id ? `<div style="margin-top: 24px; text-align: center; color: #a1a1aa; font-size: 10px;">YOCO ID: ${yoco_payment_id}</div>` : ''}
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "The Mulligan <alerts@themulligan.org>",
      to: adminEmail,
      subject,
      html,
    });
    return { data, error };
  } catch (err: any) {
    console.error('[RESEND ADMIN ERROR]', err.message);
    return { data: null, error: err };
  }
}

/**
 * GUEST CONFIRMATION: Clean, light-themed customer notification
 */
export async function sendGuestConfirmationEmail(props: ConfirmationEmailProps) {
  const { 
    guest_email, guest_name, booking_date, start_time, 
    duration_hours, player_count, simulator_id, total_price, amount_paid
  } = props;

  // 1. Skip if bypass email
  if (!guest_email || guest_email.toLowerCase().includes('walkin@venue-os.com')) {
    return { success: false, reason: 'walk-in_email' };
  }

  const subject = "Booking Confirmed - The Mulligan";
  console.log('[RESEND GUEST TRIGGER]', { to: guest_email, subject });

  try {
    const bayName = simulator_id === 1 ? "Lounge Bay" : simulator_id === 2 ? "Middle Bay" : simulator_id === 3 ? "Window Bay" : "your simulator";
    const dueAmount = Math.max(0, Number(total_price || 0) - Number(amount_paid || 0));

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #1a472a; margin-bottom: 8px;">Booking Confirmed!</h1>
          <p style="color: #666; font-size: 16px;">We've reserved a bay for you at The Mulligan.</p>
        </div>
        
        <div style="background-color: #f9f9f9; border-radius: 12px; padding: 32px; margin-bottom: 32px; border: 1px solid #eee;">
          <h2 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #1a472a; margin-bottom: 20px; text-align: center;">YOUR SESSION</h2>
          
          <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
            <span style="color: #666;">Date</span>
            <strong style="color: #1a1a1a;">${booking_date}</strong>
          </div>
          <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
            <span style="color: #666;">Time</span>
            <strong style="color: #1a1a1a;">${start_time} (${duration_hours}H)</strong>
          </div>
          <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
            <span style="color: #666;">Location</span>
            <strong style="color: #1a472a;">${bayName}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666;">Players</span>
            <strong style="color: #1a1a1a;">${player_count} Players</strong>
          </div>
        </div>

        ${dueAmount > 0 ? `
        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 32px;">
          <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
            Reminder: R ${dueAmount.toFixed(2)} is due at the venue.
          </p>
        </div>` : ''}

        <div style="text-align: center;">
          <p style="font-size: 14px; color: #666; margin-bottom: 24px;">Need to make changes? Give us a call or visit the venue.</p>
          <div style="border-top: 1px solid #eee; padding-top: 24px;">
            <p style="font-size: 12px; font-weight: 600; color: #1a472a; text-transform: uppercase; margin: 0;">The Mulligan Golf Simulator</p>
            <p style="font-size: 11px; color: #999; margin-top: 4px;">"The Simulator Never Judges"</p>
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
    return { data, error };
  } catch (err: any) {
    console.error('[RESEND GUEST ERROR]', err.message);
    return { data: null, error: err };
  }
}
