// Email notification utilities
// In production, integrate with services like Resend, SendGrid, or Postmark

export interface BookingConfirmationEmail {
  to: string
  bookingId: string
  guestName: string
  bookingDate: string
  startTime: string
  duration: number
  playerCount: number
  totalPrice: number
  cancelUrl: string
}

export async function sendBookingConfirmation(data: BookingConfirmationEmail) {
  // This is a placeholder for email sending logic
  // In production, you would integrate with an email service

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1A472A; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1A472A; color: #F5F5F5; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #F5F5F5; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e5e5; }
          .button { display: inline-block; background: #D4AF37; color: #1A472A; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏌️ Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.guestName},</p>
            <p>Your golf simulator session is confirmed! We're excited to see you on the course.</p>
            
            <div class="booking-details">
              <h2 style="color: #1A472A; margin-top: 0;">Booking Details</h2>
              <div class="detail-row">
                <span><strong>Booking ID:</strong></span>
                <span>${data.bookingId.slice(0, 8)}</span>
              </div>
              <div class="detail-row">
                <span><strong>Date:</strong></span>
                <span>${data.bookingDate}</span>
              </div>
              <div class="detail-row">
                <span><strong>Time:</strong></span>
                <span>${data.startTime}</span>
              </div>
              <div class="detail-row">
                <span><strong>Duration:</strong></span>
                <span>${data.duration} hour${data.duration > 1 ? "s" : ""}</span>
              </div>
              <div class="detail-row">
                <span><strong>Players:</strong></span>
                <span>${data.playerCount}</span>
              </div>
              <div class="detail-row" style="border-bottom: none; font-size: 18px; color: #1A472A;">
                <span><strong>Total Paid:</strong></span>
                <span><strong>R${data.totalPrice.toFixed(2)}</strong></span>
              </div>
            </div>

            <h3 style="color: #1A472A;">What to Bring:</h3>
            <ul>
              <li>Comfortable athletic wear</li>
              <li>Your confirmation email (this one!)</li>
              <li>Valid ID (for student/junior/senior rates)</li>
            </ul>

            <h3 style="color: #1A472A;">Important Information:</h3>
            <ul>
              <li>Please arrive 10 minutes early for check-in</li>
              <li>Free cancellation available up to 2 hours before your session</li>
              <li>Our staff will help you get set up and answer any questions</li>
            </ul>

            <center>
              <a href="${data.cancelUrl}" class="button">Manage Booking</a>
            </center>

            <div class="footer">
              <p>Elite Golf Sim | Premium Golf Simulator Experience</p>
              <p>Need help? Contact us at support@elitegolfsim.com</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  console.log("[v0] Email would be sent to:", data.to)
  console.log("[v0] Email content prepared for booking:", data.bookingId)

  // In production, send via email service:
  // await emailService.send({
  //   to: data.to,
  //   subject: `Booking Confirmed - ${data.bookingDate} at ${data.startTime}`,
  //   html: emailHtml
  // })

  return { success: true, emailHtml }
}

export async function sendCancellationEmail(to: string, bookingId: string, guestName: string) {
  console.log("[v0] Cancellation email would be sent to:", to)

  // In production, implement cancellation email template
  return { success: true }
}

export async function sendReminderEmail(to: string, bookingId: string, guestName: string, bookingDate: string) {
  console.log("[v0] Reminder email would be sent to:", to)

  // In production, implement reminder email template (24 hours before)
  return { success: true }
}
