# Razorpay Test Mode — Full Setup Guide

Complete guide for testing Razorpay payments locally with Cloudflare Tunnel and Webhooks.

---

## 1. Prerequisites

| Requirement | Status |
|---|---|
| Razorpay Test API Keys in [server/.env](file:///e:/Book_bind/server/.env) | ✅ `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| Webhook Secret in [server/.env](file:///e:/Book_bind/server/.env) | ✅ `RAZORPAY_WEBHOOK_SECRET=bookbind_secret_123` |
| Node.js installed | ✅ Required for `untun` |
| FastAPI server running | ✅ `uv run uvicorn app.main:app --reload` |

---

## 2. Start the Cloudflare Tunnel

Open a **new terminal** (keep your server terminal separate):

```powershell
npx untun@latest tunnel http://localhost:8000
```

You'll see output like:

```
◐ Starting cloudflared tunnel to http://localhost:8000
✔ Tunnel ready at https://some-random-words.trycloudflare.com
```

> [!IMPORTANT]
> **Copy the `https://....trycloudflare.com` URL.** This is your public URL.
> If you restart this command, the URL changes and you must update Razorpay settings.

---

## 3. Configure Webhook in Razorpay Dashboard

1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Make sure **Test Mode** is enabled (toggle at the top-left)
3. Navigate to **Account & Settings** → **Webhooks**
4. Click **+ Add New Webhook**
5. Fill in:

| Field | Value |
|---|---|
| **Webhook URL** | `https://your-url.trycloudflare.com/payments/webhooks/razorpay` |
| **Secret** | `bookbind_secret_123` |
| **Active Events** | ☑ `payment.captured` |

6. Click **Create Webhook**

> [!NOTE]
> The **Secret** you enter here must exactly match `RAZORPAY_WEBHOOK_SECRET` in your [server/.env](file:///e:/Book_bind/server/.env) file.

---

## 4. Make a Test Payment

### Step 4a: Open an Order
1. Go to your Client app → **Dashboard** → **Orders**
2. Open an order with status **WAITING_PAYMENT**
3. Click the **Pay Online** button

### Step 4b: Complete Payment in Modal
The Razorpay checkout modal will appear. **Do NOT use UPI/QR** — they don't work in Test Mode.

Click **Cards** and use one of these **Indian domestic test cards**:

| Card Number | Type | Result |
|---|---|---|
| `5267 3181 8797 5449` | Mastercard (Domestic) | ✅ Success |
| `6074 8190 0004 8965` | RuPay | ✅ Success |

Fill in:
- **Expiry**: Any future date (e.g., `12/30`)
- **CVV**: Any 3 digits (e.g., `123`)
- **Name**: Anything

Click **Pay** → On the next screen click **Success**.

> [!CAUTION]
> **Do NOT scan the QR code** with a real UPI app. Test Mode QR codes are invalid and real apps will show "Can't pay to this QR."
> **Do NOT use `4111 1111 1111 1111`** — it's treated as an international card and will be rejected if international payments aren't enabled.

---

## 5. What Happens After Payment

### Flow 1: Frontend Verification (Instant)
```
Customer clicks "Success" in modal
        ↓
Razorpay modal sends payment ID + signature to browser
        ↓
Browser calls POST /payments/verify
        ↓
Backend verifies signature → Records Transaction → Marks milestone PAID
        ↓
Customer sees "Payment Successful" immediately
```

### Flow 2: Webhook (Fail-Safe, Background)
```
Razorpay servers detect payment.captured
        ↓
Razorpay sends POST to your Cloudflare tunnel URL
        ↓
Your backend at /payments/webhooks/razorpay receives it
        ↓
Verifies signature → Checks if already processed → Updates order if needed
```

> [!TIP]
> Both flows run in parallel. The webhook acts as a safety net — if the customer closes the browser before Flow 1 completes, Flow 2 still catches it.

---

## 6. Verify Everything Worked

### Check Server Terminal
You should see these log lines:
```
POST /payments/create-order  → 200 OK
POST /payments/verify         → 200 OK
POST /payments/webhooks/razorpay → 200 OK  (arrives a few seconds later)
```

### Check Razorpay Dashboard
Go to **Transactions** (in Test Mode) — you'll see the test payment listed.

### Check Your Database
The order's milestone status should now be `PAID`, and a [Transaction](file:///e:/Book_bind/client/app/dashboard/orders/%5Bid%5D/page.tsx#11-19) record should exist.

---

## 7. Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `502 Bad Gateway` on create-order | Invalid API keys | Regenerate keys in Razorpay Dashboard → Update [.env](file:///e:/Book_bind/server/.env) → Restart server |
| `receipt: length must be no more than 40` | Receipt string too long | ✅ Already fixed (uses shortened UUIDs) |
| "International card not supported" | Using `4111...` test card | Use domestic card: `5267 3181 8797 5449` |
| "Can't pay to this QR" | Scanning test QR with real app | Use **Cards** instead — QR doesn't work in Test Mode |
| Webhook not received | Tunnel URL changed | Copy new URL → Update in Razorpay Dashboard |
| `Invalid signature` on webhook | Secret mismatch | Ensure Razorpay secret = `RAZORPAY_WEBHOOK_SECRET` in [.env](file:///e:/Book_bind/server/.env) |

---

## 8. Going Live (Production Checklist)

When ready to accept real payments:

- [ ] Switch Razorpay Dashboard to **Live Mode**
- [ ] Generate **Live Mode** API keys
- [ ] Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in [.env](file:///e:/Book_bind/server/.env)
- [ ] Set up a **permanent webhook URL** (your production domain, not a tunnel)
- [ ] Generate a **strong webhook secret** (not `bookbind_secret_123`)
- [ ] Update `RAZORPAY_WEBHOOK_SECRET` in [.env](file:///e:/Book_bind/server/.env)
- [ ] Update `NEXT_PUBLIC_RAZORPAY_KEY_ID` in client [.env](file:///e:/Book_bind/server/.env) if applicable
- [ ] Test one real ₹1 payment to confirm end-to-end flow
