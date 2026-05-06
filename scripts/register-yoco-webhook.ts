// scripts/register-yoco-webhook.ts

async function registerWebhook() {
  const apiKey = process.env.YOCO_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: YOCO_API_KEY environment variable is not set.');
    console.error('Please run the script as: YOCO_API_KEY="yoco_live_..." npx tsx scripts/register-yoco-webhook.ts');
    process.exit(1);
  }

  const url = 'https://api.yoco.com/v1/webhooks/subscriptions/';

  const payload = {
    name: "Venue OS Main Payment Webhook",
    notification_url: "https://www.themulligan.co.za/api/webhooks/yoco",
    event_types: ["payment.created"]
  };

  console.log(`📡 Registering Webhook with Yoco...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log('====================================');
    console.log(`HTTP Status: ${response.status}`);
    console.log('Response Output:');
    console.log(JSON.stringify(data, null, 2));
    console.log('====================================');

    if (response.ok && data.secret) {
      console.log('✅ Webhook Successfully Registered!');
      console.log(`🔑 YOUR WEBHOOK SECRET IS: ${data.secret}`);
    } else {
      console.error('❌ Failed to register webhook.');
    }

  } catch (error) {
    console.error('💥 Network Error:', error);
  }
}

registerWebhook();
