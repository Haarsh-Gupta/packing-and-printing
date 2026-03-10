# Testing Guide for FastAPI Docs (Swagger UI)

This guide walks you through the exact sequence of API calls to test Inquiries, Orders, Milestone Switching, and SSE using `http://localhost:8000/docs`.

### Prerequisites
1. Open `http://localhost:8000/docs`
2. Click the **Authorize** button at the top right and log in as an **Admin User**.
3. (Optional) Open standard User session in a completely separate incognito window.

---

## 1. Testing the Inquiry Flow

**Goal:** Create an inquiry, then have the admin convert it to an order.

1. **User (or Admin acting as User)**: Go to **`POST /inquiries/`**
   - Provide basic inquiry details and select a product.
   - Note the `id` of the created inquiry group.

2. **Admin**: Go to **`PATCH /admin/inquiries/{inquiry_id}/status`**
   - Set the `inquiry_id` to the one created above.
   - Change status to `"QUOTED"` or `"APPROVED"`.

3. **Admin**: Go to **`POST /admin/orders/`** *(Assuming you have an admin order creation endpoint that maps inquiries to orders, based on standard e-commerce flows)*
   - Pass the `inquiry_id` to generate the new order.
   - *Note the generated `order_id`*.
   - By default, the admin will set a price and a default split (e.g., `HALF`).

---

## 2. Testing Milestone Switching (User Side)

**Goal:** Allow the user to change their mind on the payment split before paying.

1. **User**: Go to **`PATCH /orders/{order_id}/switch-milestone`**
   - Enter the `order_id`.
   - In the request body, send:
     ```json
     {
       "split_type": "FULL"
     }
     ```
   - **Expected Result:** Order returns with 1 milestone for 100% of the amount.
   
2. **User**: Call it again but with `HALF`.
   - **Expected Result:** Order returns with 2 milestones (Advance 50%, Balance 50%).

3. **User**: Try to submit `CUSTOM`.
   - **Expected Result:** HTTP 400 Bad Request (Users aren't allowed to use custom splits).

---

## 3. Testing Payments & Status Changes

**Goal:** Simulate recording a payment and changing the order status.

1. **Admin**: Go to **`POST /admin/orders/{order_id}/payment`**
   - Provide the `order_id` and the `milestone_id` (copy from the order response).
   - Provide amount and payment mode (e.g., `UPI`).
   - Execute.
   - **Check:** The exact milestone is marked `is_paid = true`. Order status updates to `PARTIALLY_PAID` or `PAID`.

2. **User**: Go back to **`PATCH /orders/{order_id}/switch-milestone`** and try to change it again.
   - **Expected Result:** HTTP 400 Bad Request ("Cannot switch milestones — payment has already started").

3. **Admin**: Go to **`PATCH /admin/orders/{order_id}/status`**
   - Change the status from `PARTIALLY_PAID` to `PROCESSING`.
   - Execute to see the updated order.

---

## 4. Testing Server-Sent Events (SSE)

Browsers (and Swagger UI) don't display streams natively inside the typical JSON response boxes. To test the real-time push:

1. **Open the Test Client:** 
   - Double-click the file `E:\Book_bind\server\sse_test.html` in your web browser.
2. **Authorize via Query Params (Important):**
   - Typically, EventSource in browsers cannot send HTTP headers (like `Authorization: Bearer <token>`). 
   - If your auth only accepts headers, use `curl` instead (see below). If your auth accepts `?token=YOUR_TOKEN` query params, use the HTML file.

**Testing with cURL (Always works):**
Open your terminal (PowerShell or Git Bash):
```bash
curl -N -H "Authorization: Bearer YOUR_ACCESS_TOKEN" http://localhost:8000/events/stream
```
Leave it running. It will say `event: connected`.

**Trigger the events:**
While `curl` or the HTML page is running, go back to FastAPI Docs:
1. Trigger a milestone switch (`PATCH /orders/{order_id}/switch-milestone`).
2. Record a payment as an Admin (`POST /admin/orders/{order_id}/payment`).
3. Change the order status (`PATCH /admin/orders/{order_id}/status`).

Look at your terminal/HTML page. You will instantly see messages pop up like:
```text
event: milestones_changed
data: {"order_id": "...", "split_type": "FULL", "milestone_count": 1}

event: order_status_changed
data: {"order_id": "...", "old_status": "WAITING_PAYMENT", "new_status": "PROCESSING"}
```

### Note on Email/WhatsApp
Whenever you trigger those payment/status routes, check the console where `uvicorn app.main:app --reload` is running. You should see logs indicating:
`[WhatsAppLink] Generated link for ...`
`[EmailMessenger] Failed to send ...` (if Brevo credentials aren't set) 
This confirms the notification dispatcher fired successfully without crashing the API!
