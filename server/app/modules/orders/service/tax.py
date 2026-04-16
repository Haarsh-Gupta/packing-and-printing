"""
Central GST tax computation helpers.

Rules:
- SubProducts / SubServices store a single `gst_rate` (e.g. 18.0 for 18%).
- Valid GST slabs in India: 0%, 5%, 12%, 18%, 28%.
- Intra-state (same state)  → CGST = gst_rate/2, SGST = gst_rate/2
- Inter-state (diff state)  → IGST = gst_rate
- CESS is not used in standard slabs; kept at 0 unless explicitly set.
"""

from typing import Dict

VALID_GST_SLABS = {0.0, 5.0, 12.0, 18.0, 28.0}


def determine_interstate(company_state_code: str, customer_state_code: str) -> bool:
    """
    Return True if the transaction is inter-state (IGST applies).
    Both codes should be 2-digit string state codes (e.g. "07" for Delhi).
    If either code is missing/empty, default to intra-state (CGST+SGST).
    """
    if not company_state_code or not customer_state_code:
        return False  # default: intra-state
    return str(company_state_code).strip() != str(customer_state_code).strip()


def split_gst_rate(gst_rate: float, is_interstate: bool) -> Dict[str, float]:
    """
    Split a unified gst_rate into CGST/SGST or IGST based on inter/intra state.

    Returns dict with keys: cgst_rate, sgst_rate, igst_rate
    """
    gst_rate = float(gst_rate or 0.0)
    if is_interstate:
        return {
            "cgst_rate": 0.0,
            "sgst_rate": 0.0,
            "igst_rate": gst_rate,
        }
    else:
        half = round(gst_rate / 2, 2)
        return {
            "cgst_rate": half,
            "sgst_rate": half,
            "igst_rate": 0.0,
        }


def compute_line_item_tax(
    gst_rate: float,
    taxable_value: float,
    is_interstate: bool,
) -> Dict[str, float]:
    """
    Compute tax amounts for a single line item.

    Returns dict with:
        cgst_rate, sgst_rate, igst_rate,
        cgst_amt, sgst_amt, igst_amt,
        total_tax
    """
    rates = split_gst_rate(gst_rate, is_interstate)
    taxable_value = float(taxable_value or 0.0)

    cgst_amt = round(taxable_value * rates["cgst_rate"] / 100, 2)
    sgst_amt = round(taxable_value * rates["sgst_rate"] / 100, 2)
    igst_amt = round(taxable_value * rates["igst_rate"] / 100, 2)

    return {
        **rates,
        "cgst_amt": cgst_amt,
        "sgst_amt": sgst_amt,
        "igst_amt": igst_amt,
        "total_tax": round(cgst_amt + sgst_amt + igst_amt, 2),
    }


def validate_gst_slab(rate: float) -> bool:
    """Check if the given rate is a valid Indian GST slab."""
    return float(rate) in VALID_GST_SLABS
