import os

from app.core.email.templates.order_status import render_order_status_email
from app.core.email.templates.payment_declaration import render_declaration_review_email
from app.core.email.templates.payment_recorded import render_payment_recorded_email

def create_previews():
    html1 = render_order_status_email(
        order_number="ORD-7890", 
        new_status="SHIPPED", 
        user_name="Rahul Kumar", 
        admin_notes="Your package is dispatched by BlueDart. Tracking URL: bluedart.com/track"
    )
    
    html2 = render_declaration_review_email(
        order_number="ORD-7890", 
        is_approved=False, 
        reason="The UTR number provided does not match any transaction in our bank statements. Please re-check and upload again.", 
        user_name="Rahul Kumar"
    )
    
    html3 = render_declaration_review_email(
        order_number="ORD-7890", 
        is_approved=True, 
        order_status="PROCESSING", 
        user_name="Rahul Kumar"
    )
    
    html4 = render_payment_recorded_email(
        order_number="ORD-7890", 
        amount=15000.0, 
        balance=5000.0, 
        user_name="Rahul Kumar"
    )

    client_public_dir = os.path.join(os.path.dirname(__file__), "..", "client", "public")
    
    with open(os.path.join(client_public_dir, "preview_order_status.html"), "w", encoding="utf-8") as f:
        f.write(html1)
        
    with open(os.path.join(client_public_dir, "preview_decl_rejected.html"), "w", encoding="utf-8") as f:
        f.write(html2)
        
    with open(os.path.join(client_public_dir, "preview_decl_approved.html"), "w", encoding="utf-8") as f:
        f.write(html3)
        
    with open(os.path.join(client_public_dir, "preview_payment_recorded.html"), "w", encoding="utf-8") as f:
        f.write(html4)
        
    print("Previews generated successfully in the client/public folder.")

if __name__ == "__main__":
    create_previews()
