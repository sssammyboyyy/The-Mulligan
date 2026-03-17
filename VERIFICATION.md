# Live Payment Verification Runbook

When a customer reports making a payment, but the backend shows "Pending," rely on this single-click procedure perfectly integrated into the Admin UI.

## Step 1. Identify the Booking Anomaly
- Log into the secure Admin dashboard using your PIN.
- Click the **"Health"** tab. Look for the customer’s name.
- Any row highlighted in **red** with a Yoco ID but R0 Paid means the Yoco webhook dropped or the user closed their tab too early. 

## Step 2. Force Reconciliation (One-Click Self-Healing)
- In the far right "Actions" column, locate the circular **Refresh/Sync icon**. 
- Click it. It will temporarily highlight green and spin.
- The UI will explicitly alert you:
   - `✅ Sync Complete`: The backend queried Yoco, found the live payment, securely patched Supabase, and sent a real-time pulse to n8n to send the confirmation email.
   - `⚠️ Sync Checked`: The backend queried Yoco, and Yoco confirms the customer truly abandoned the cart or their card declined. You do not need to do anything else.
   - `ℹ️ No anomalies`: The booking is fully synced and paid.

## Step 3. Confirm Automation Results
- The UI table will automatically refresh. The Red limbo row will clear, `Current Status` will jump to `confirmed`, and the `Automation Sent` column will proudly bear a green checkmark.
- If the store manager's inbox remains empty, check the real-time n8n "Execution Logs" UI to see if Resend rejected the API delivery.

---

*(For developers and deep-debugging, you can still natively trigger the REST APIs via POST as specified in earlier PRs: `curl -X POST "/api/reconcile-payments" -H "Authorization: Bearer SECRET"`)*
