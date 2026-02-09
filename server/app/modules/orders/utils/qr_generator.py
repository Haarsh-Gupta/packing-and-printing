import qrcode
from io import BytesIO
import base64
from typing import Optional

def generate_upi_qr(upi_id : str , name : str , amount : float , transaction_note: Optional[str] = None):
    """
    Generate a UPI QR code for a specific order.
    """
    upi_string = f"upi://pay?pa={upi_id}&pn={name}&am={amount}"

    if transaction_note:
        upi_string += f"&tn={transaction_note}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(upi_string)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return img_base64
    
def generate_payment_qr(
    payment_data: str,
    size: int = 10,
    border: int = 4
) -> str:
    """
    Generate a generic QR code for payment or any data
    
    Args:
        payment_data: Data to encode in QR code
        size: Box size for QR code
        border: Border size
    
    Returns:
        Base64 encoded QR code image
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=size,
        border=border,
    )
    qr.add_data(payment_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return img_str


def save_qr_to_file(qr_base64: str, filepath: str):
    """
    Save base64 QR code to file
    
    Args:
        qr_base64: Base64 encoded QR code
        filepath: Path to save the QR code
    """
    img_data = base64.b64decode(qr_base64)
    with open(filepath, 'wb') as f:
        f.write(img_data)