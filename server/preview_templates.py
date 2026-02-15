"""
Email Template Preview Generator

Run this script to generate HTML preview files for all email templates.
Open the generated files in your browser to see how they look.

Usage:
    python preview_templates.py
"""

import os

# Add the project root to the path so we can import the templates
import sys
sys.path.insert(0, os.path.dirname(__file__))

from app.core.email.templates.otp import render_otp_email
from app.core.email.templates.password_reset import render_password_reset_email
from app.core.email.templates.invoice import render_invoice_email
from app.core.email.templates.reminder import render_reminder_email
from app.core.email.templates.admin_notice import render_admin_notice_email
from app.core.email.templates.custom import render_custom_email

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "email_previews")
os.makedirs(OUTPUT_DIR, exist_ok=True)

templates = {
    "otp": render_otp_email(
        otp_code="482916",
        expire_minutes=5,
        user_name="Harsh",
    ),
    "password_reset": render_password_reset_email(
        otp_code="731054",
        expire_minutes=5,
        user_name="Harsh",
    ),
    "invoice": render_invoice_email(
        order_id=1042,
        items=[
            {"description": "Notebook A5 — Hardcover, 200 pages\nOptions: Paper: 80gsm, Binding: Perfect", "quantity": 500, "unit_price": 45.00, "total": 22500.00},
            {"description": "Business Cards — Matte Finish", "quantity": 1000, "unit_price": 2.50, "total": 2500.00},
        ],
        total_amount=25000.00,
        amount_paid=10000.00,
        payment_status="PARTIALLY_PAID",
        user_name="Harsh",
    ),
    "reminder": render_reminder_email(
        order_id=1042,
        due_amount=15000.00,
        due_date="28 Feb 2026",
        message="Please complete the remaining payment to proceed with printing. We've reserved your slot in the production queue.",
        user_name="Harsh",
    ),
    "admin_notice": render_admin_notice_email(
        subject="Your Order is Ready for Pickup!",
        message="Your order <strong>#1042</strong> has been completed and is ready for pickup at our workshop. Please bring your order confirmation when you visit.",
        action_url="https://bookbind.com/orders/1042",
        action_label="View Order Details",
        user_name="Harsh",
    ),
    "custom_greeting": render_custom_email(
        heading="Happy Diwali! 🪔✨",
        message="""\
Wishing you and your family a very <strong>Happy Diwali</strong>!<br><br>
May this festival of lights bring joy, prosperity, and happiness to your life. 🎆<br><br>
As a token of our appreciation, enjoy <strong>20% OFF</strong> on all orders placed this week!""",
        image_url="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=600&h=300&fit=crop",
        action_url="https://bookbind.com/offers",
        action_label="Shop Now 🎁",
        user_name="Harsh",
    ),
}

print(f"Generating previews in: {OUTPUT_DIR}\n")

for name, html in templates.items():
    filepath = os.path.join(OUTPUT_DIR, f"{name}.html")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  ✓ {name}.html")

print(f"\nDone! Open any file in your browser to preview.")
print(f"Folder: {OUTPUT_DIR}")
