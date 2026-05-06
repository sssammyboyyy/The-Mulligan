import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env
dotenv.config({ path: resolve(process.cwd(), '.env') });

async function testWebhook() {
  const secret = process.env.YOCO_WEBHOOK_SECRET;

  if (!secret) {
    console.error('❌ Error: YOCO_WEBHOOK_SECRET is not defined in your .env file.');
    process.exit(1);
  }

  // 1. Construct Mock Payload
  const payload = {
    id: "evt_test_12345",
    type: "payment.succeeded",
    createdDate: new Date().toISOString(),
    payload: {
      id: "pay_test_67890",
      type: "payment",
      status: "successful",
      amount: 48000, // Amount in cents
      currency: "ZAR",
      metadata: {
        booking_request_id: "8c9f39a0-8d9e-4065-96d9-d038eb858d3e",
        customer_email: "test@example.com"
      }
    }
  };

  const payloadString = JSON.stringify(payload);

  // 2. Generate HMAC SHA-256 Signature
  console.log(`🔐 Generating signature using secret: ${secret.substring(0, 8)}...`);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');

  console.log(`📝 Generated Signature: ${signature}`);

  // 3. Dispatch Webhook to Localhost
  const url = 'http://localhost:3000/api/webhooks/yoco';
  console.log(`🚀 Dispatching to ${url}...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'webhook-signature': signature
      },
      body: payloadString
    });

    const responseStatus = response.status;
    const responseText = await response.text();

    console.log('====================================');
    console.log(`HTTP Status: ${responseStatus}`);
    console.log(`Response Body: ${responseText}`);
    console.log('====================================');

    if (response.ok) {
      console.log('✅ Webhook processed successfully!');
    } else {
      console.error('❌ Webhook processing failed.');
    }

  } catch (error) {
    console.error('💥 Network Error:', error);
  }
}

testWebhook();
