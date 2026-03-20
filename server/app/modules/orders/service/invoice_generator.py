"""
invoice_generator.py  –  Professional Printing & Packing Tax Invoice
Sections: Header | Info Box | Items | Taxes | Financial Summary | Declaration | Footer
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, Image, HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

logger = logging.getLogger(__name__)

# ── Fonts (cross-platform: bundled → Segoe UI → DejaVu → Helvetica) ───────────
_FONT_SEARCH = [
    # 1. Bundled in project
    (os.path.join(os.path.dirname(__file__), "..", "..", "..", "static", "fonts"), "NotoSans"),
    # 2. Windows – Segoe UI (modern look, has ₹ glyph)
    ("C:/Windows/Fonts", "segoeui"),
    # 3. Linux – DejaVu
    ("/usr/share/fonts/truetype/dejavu", "DejaVuSans"),
]

NRM, BLD = "Helvetica", "Helvetica-Bold"  # fallback
for _dir, _base in _FONT_SEARCH:
    _r = os.path.join(_dir, f"{_base}.ttf")
    _b = os.path.join(_dir, f"{_base}-Bold.ttf") if "segoe" not in _base else os.path.join(_dir, f"{_base}b.ttf")
    if os.path.isfile(_r) and os.path.isfile(_b):
        try:
            pdfmetrics.registerFont(TTFont("InvR", _r))
            pdfmetrics.registerFont(TTFont("InvB", _b))
            pdfmetrics.registerFontFamily("InvR", normal="InvR", bold="InvB")
            NRM, BLD = "InvR", "InvB"
            break
        except Exception:
            continue

# ── Palette ────────────────────────────────────────────────────────────────────
NAVY     = colors.HexColor("#2c3e6b")
DARK     = colors.HexColor("#111827")
LIGHT_BG = colors.HexColor("#f8f9fc")
HDR_BG   = colors.HexColor("#eef0f8")
BORDER   = colors.HexColor("#c8cdd8")
GRID     = colors.HexColor("#dde1ea")
MUTED    = colors.HexColor("#6b7280")
WHITE    = colors.white

# Row padding constants
HP, RP, SP = 5, 5, 2   # header / regular / summary


# ── Helpers ────────────────────────────────────────────────────────────────────
def _grand_total(items: List[Dict], order_data: Dict) -> float:
    """Compute invoice grand total from line items + shipping - order discount."""
    line_total = lambda i: float(i.get("unit_price", 0)) * float(i.get("quantity", 1))
    subtotal = sum(line_total(i) for i in items)
    tax = sum(
        line_total(i) * (
            float(i.get("cgst_rate", 0)) +
            float(i.get("sgst_rate", 0)) +
            float(i.get("igst_rate", 0))
        ) / 100
        for i in items
    )
    shipping   = float(order_data.get("shipping_amount", 0) or 0)
    order_disc = float(order_data.get("order_discount",  0) or 0)
    return round(subtotal + tax + shipping - order_disc, 2)


def _amount_in_words(amount: float) -> str:
    """Convert a rupee amount to Indian-English words."""
    ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
            "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
            "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty",
            "Sixty", "Seventy", "Eighty", "Ninety"]

    def _b1k(n):
        if n == 0:   return ""
        if n < 20:   return ones[n]
        if n < 100:  return tens[n // 10] + (" " + ones[n % 10] if n % 10 else "")
        return ones[n // 100] + " Hundred" + (" " + _b1k(n % 100) if n % 100 else "")

    def _conv(n):
        if n == 0: return "Zero"
        parts = []
        for thr, lbl in [(10_000_000, "Crore"), (100_000, "Lakh"), (1_000, "Thousand")]:
            if n >= thr:
                parts.append(_b1k(n // thr) + " " + lbl)
                n %= thr
        if n: parts.append(_b1k(n))
        return " ".join(parts)

    r, p = int(amount), round((amount - int(amount)) * 100)
    return _conv(r) + " Rupees" + (f" and {_conv(p)} Paise" if p else "") + " Only"


# ══════════════════════════════════════════════════════════════════════════════
class TaxInvoiceGenerator:

    def __init__(self, filename: str, pagesize=A4):
        self.filename = filename
        self.W, self.H = pagesize
        self.styles = getSampleStyleSheet()
        self._build_styles()

    # ── Paragraph styles ───────────────────────────────────────────────────────
    def _build_styles(self):
        def A(name, **kw):
            self.styles.add(ParagraphStyle(name,
                parent=kw.pop("p", self.styles["Normal"]), **kw))

        # Header
        A("CoName",    fontName=BLD, fontSize=13, textColor=NAVY,  leading=17)
        A("CoSub",     fontName=NRM, fontSize=7,  textColor=DARK,  leading=10)
        A("TaxHdr",    fontName=BLD, fontSize=20, textColor=NAVY,  leading=25, alignment=TA_RIGHT)

        # Section heading
        A("SecHdr",    fontName=BLD, fontSize=9,  textColor=NAVY,  leading=13, spaceAfter=3)

        # Info box
        A("LblSm",     fontName=NRM, fontSize=7,  textColor=MUTED, leading=9.5)
        A("LblBold",   fontName=BLD, fontSize=7.5,textColor=DARK,  leading=10.5)
        A("ValNorm",   fontName=NRM, fontSize=8,  textColor=DARK,  leading=11)
        A("ValBold",   fontName=BLD, fontSize=8.5,textColor=DARK,  leading=12)
        A("BillTitle", fontName=BLD, fontSize=7.5,textColor=MUTED, leading=10)
        A("BillName",  fontName=BLD, fontSize=10, textColor=DARK,  leading=13)
        A("BillSub",   fontName=NRM, fontSize=7,  textColor=DARK,  leading=10)

        # Table cells
        A("TC",        fontName=NRM, fontSize=7.5,textColor=DARK,  leading=10)
        A("TCR",       fontName=NRM, fontSize=7.5,textColor=DARK,  leading=10, alignment=TA_RIGHT)
        A("TCC",       fontName=NRM, fontSize=7.5,textColor=DARK,  leading=10, alignment=TA_CENTER)
        A("TBR",       fontName=BLD, fontSize=7.5,textColor=DARK,  leading=10, alignment=TA_RIGHT)
        A("TBC",       fontName=BLD, fontSize=7.5,textColor=DARK,  leading=10, alignment=TA_CENTER)
        A("TBL",       fontName=BLD, fontSize=7.5,textColor=DARK,  leading=10)
        A("Specs",     fontName=NRM, fontSize=6.5,textColor=MUTED, leading=9)

        # Footer
        A("Ftr",       fontName=NRM, fontSize=8.5,textColor=MUTED, leading=12, alignment=TA_CENTER)
        A("FtrB",      fontName=BLD, fontSize=10, textColor=NAVY,  leading=14, alignment=TA_CENTER)

    # ── Entry point ────────────────────────────────────────────────────────────
    def generate_invoice(
        self,
        invoice_number: str,
        invoice_date:   datetime,
        order_data:     Dict[str, Any],
        company_info:   Dict[str, str],
        customer_info:  Dict[str, str],
        items:          List[Dict],
        logo_path:      Optional[str] = None,
        due_date:       Optional[datetime] = None,
    ):
        doc = SimpleDocTemplate(
            self.filename, pagesize=(self.W, self.H),
            rightMargin=0.50*inch, leftMargin=0.50*inch,
            topMargin=0.40*inch,   bottomMargin=0.45*inch,
        )
        U = self.W - 1.0*inch   # usable width
        s = []

        s += self._header(company_info, logo_path, U)
        s.append(HRFlowable(width="100%", thickness=2, color=NAVY, spaceAfter=4))
        s += self._info_box(customer_info, order_data, invoice_number,
                            invoice_date, due_date, U)
        s.append(Spacer(1, 5))
        s += self._items_table(items, U)
        s.append(Spacer(1, 4))
        s += self._taxes_table(items, U)
        s.append(Spacer(1, 4))
        s += self._financial_summary(items, order_data, U)
        s.append(Spacer(1, 4))
        s += self._declaration_block(items, order_data, U)
        s.append(Spacer(1, 3))
        s += self._footer(company_info)

        doc.build(s)

    # ── S1: Header ─────────────────────────────────────────────────────────────
    def _header(self, co, logo_path, U):
        left = []
        if logo_path and os.path.isfile(logo_path):
            try:
                img = Image(logo_path, width=1.0*inch, height=0.45*inch)
                img.hAlign = "LEFT"
                left.append(img)
                left.append(Spacer(1, 2))
            except Exception:
                pass

        left.append(Paragraph(co.get("name", ""), self.styles["CoName"]))
        lines = []
        if co.get("address"):  lines.append(co["address"])
        if co.get("gstin"):    lines.append(f"GSTIN/UIN : {co['gstin']}")
        if co.get("pan"):      lines.append(f"PAN        : {co['pan']}")
        cx = []
        if co.get("phone"):    cx.append(f"Phone: {co['phone']}")
        if co.get("email"):    cx.append(f"Email: {co['email']}")
        if cx: lines.append("  |  ".join(cx))
        if co.get("website"):  lines.append(co["website"])
        left.append(Paragraph("<br/>".join(lines), self.styles["CoSub"]))

        lt = Table([[r] for r in left], colWidths=[U * 0.58])
        lt.setStyle(TableStyle([
            ("VALIGN",       (0,0),(-1,-1), "TOP"),
            ("LEFTPADDING",  (0,0),(-1,-1), 0), ("RIGHTPADDING", (0,0),(-1,-1), 0),
            ("TOPPADDING",   (0,0),(-1,-1), 0), ("BOTTOMPADDING",(0,0),(-1,-1), 2),
        ]))
        rt = Table([[Paragraph("TAX INVOICE", self.styles["TaxHdr"])]],
                   colWidths=[U * 0.42])
        rt.setStyle(TableStyle([
            ("VALIGN",       (0,0),(-1,-1), "MIDDLE"),
            ("LEFTPADDING",  (0,0),(-1,-1), 0), ("RIGHTPADDING", (0,0),(-1,-1), 0),
        ]))
        hdr = Table([[lt, rt]], colWidths=[U * 0.58, U * 0.42])
        hdr.setStyle(TableStyle([
            ("VALIGN",       (0,0),(-1,-1), "TOP"),
            ("LEFTPADDING",  (0,0),(-1,-1), 0), ("RIGHTPADDING", (0,0),(-1,-1), 0),
        ]))
        return [hdr, Spacer(1, 5)]

    # ── S2: Info box ───────────────────────────────────────────────────────────
    def _info_box(self, cust, order, inv_num, inv_date, due_date, U):
        def _lv(lbl, val, bold=False):
            return [Paragraph(lbl, self.styles["LblSm"]),
                    Paragraph(str(val), self.styles["ValBold" if bold else "ValNorm"])]

        # Column widths that sum exactly to U
        C1W = U * 0.35
        C2W = U * 0.34
        C3W = U - C1W - C2W

        # Col 1 – Bill To
        c1 = [[Paragraph("Bill To", self.styles["BillTitle"])],
               [Paragraph(cust.get("name", ""), self.styles["BillName"])]]
        for fld, lbl in [("address",""), ("gstin","GSTIN/UIN"),
                          ("email","Email"), ("phone","Phone")]:
            if cust.get(fld):
                txt = f"{lbl} : {cust[fld]}" if lbl else cust[fld]
                c1.append([Paragraph(txt, self.styles["BillSub"])])
        col1 = Table(c1, colWidths=[C1W])
        col1.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),
            ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),2),
            ("TOPPADDING",(0,0),(-1,-1),1),("BOTTOMPADDING",(0,0),(-1,-1),1)]))

        # Col 2 – Invoice details
        status = order.get("status", "").replace("_", " ").title()
        c2 = (_lv("Invoice No:", inv_num, bold=True) +
               _lv("Order ID:", order.get("order_id", "")) +
               [Spacer(1, 3)] + _lv("Status:", status))
        col2 = Table([[r] for r in c2], colWidths=[C2W])
        col2.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),
            ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),2),
            ("TOPPADDING",(0,0),(-1,-1),1),("BOTTOMPADDING",(0,0),(-1,-1),1)]))

        # Col 3 – Dates
        due_str = due_date.strftime("%d-%b-%Y") if due_date else inv_date.strftime("%d-%b-%Y")
        c3 = (_lv("Invoice Date:", inv_date.strftime("%d-%b-%Y"), bold=True) +
               [Spacer(1, 3)] + _lv("Due Date:", due_str, bold=True))
        if order.get("order_date"):
            c3 += [Spacer(1, 3)] + _lv("Order Date:", order["order_date"])
        col3 = Table([[r] for r in c3], colWidths=[C3W])
        col3.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),
            ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
            ("TOPPADDING",(0,0),(-1,-1),1),("BOTTOMPADDING",(0,0),(-1,-1),1)]))

        box = Table([[col1, col2, col3]], colWidths=[C1W, C2W, C3W])
        box.setStyle(TableStyle([
            ("VALIGN",       (0,0),(-1,-1), "TOP"),
            ("BOX",          (0,0),(-1,-1), 0.75, BORDER),
            ("LINEBEFORE",   (1,0),(1,-1),  0.5,  BORDER),
            ("LINEBEFORE",   (2,0),(2,-1),  0.5,  BORDER),
            ("BACKGROUND",   (0,0),(-1,-1), LIGHT_BG),
            ("LEFTPADDING",  (0,0),(-1,-1), 7), ("RIGHTPADDING", (0,0),(-1,-1), 7),
            ("TOPPADDING",   (0,0),(-1,-1), 8), ("BOTTOMPADDING",(0,0),(-1,-1), 8),
        ]))
        return [box]

    # ── S3: Items table ────────────────────────────────────────────────────────
    # Cols: S.No | Description + Specs | HSN/SAC | Quantity | Rate | Amount
    def _items_table(self, items, U):
        elems = [Paragraph("Items", self.styles["SecHdr"])]

        NUM  = 0.28*inch
        HSN  = 0.78*inch
        QTY  = 0.72*inch
        RATE = 0.80*inch
        AMT  = 1.05*inch          # shared with taxes table
        DESC = U - NUM - HSN - QTY - RATE - AMT
        cw   = [NUM, DESC, HSN, QTY, RATE, AMT]

        def _h(txt, al=TA_CENTER):
            return Paragraph(txt, ParagraphStyle("_ih", parent=self.styles["Normal"],
                fontName=BLD, fontSize=7.5, textColor=WHITE, alignment=al, leading=10))

        data = [[_h("S.No"), _h("Description of Goods", TA_LEFT),
                 _h("HSN/SAC"), _h("Quantity"), _h("Rate"), _h("Amount")]]

        subtotal = 0.0
        for idx, item in enumerate(items, 1):
            qty  = float(item.get("quantity", 1))
            rate = float(item.get("unit_price", 0))
            net  = rate * qty
            subtotal += net

            desc = item.get("description", "Item")
            if item.get("variant"): desc += f" ({item['variant']})"
            specs = item.get("specs", "")
            if specs:
                desc_tbl = Table(
                    [[Paragraph(desc, self.styles["TC"])],
                     [Paragraph(specs, self.styles["Specs"])]],
                    colWidths=[DESC])
                desc_tbl.setStyle(TableStyle([
                    ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
                    ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
                ]))
                desc_cell = desc_tbl
            else:
                desc_cell = Paragraph(desc, self.styles["TC"])

            qty_str = f"{qty:.0f}" + (f" {item['unit']}" if item.get("unit") else " Nos")
            data.append([
                Paragraph(str(idx),         self.styles["TCC"]),
                desc_cell,
                Paragraph(str(item.get("hsn_sac", "")), self.styles["TCC"]),
                Paragraph(qty_str,          self.styles["TCC"]),
                Paragraph(f"\u20b9{rate:,.2f}",  self.styles["TCR"]),
                Paragraph(f"\u20b9{net:,.2f}",   self.styles["TBR"]),
            ])

        n = len(data)   # rows so far (header + items)

        # Summary rows below items: cols 0-4 span as label, col 5 = value
        cgst_r = max((float(i.get("cgst_rate", 0)) for i in items), default=0)
        sgst_r = max((float(i.get("sgst_rate", 0)) for i in items), default=0)
        igst_r = max((float(i.get("igst_rate", 0)) for i in items), default=0)
        cgst_a = subtotal * cgst_r / 100
        sgst_a = subtotal * sgst_r / 100
        igst_a = subtotal * igst_r / 100
        grand  = subtotal + cgst_a + sgst_a + igst_a

        def _sr(lbl, val, bold=False):
            ls = "TBR" if bold else "TCR"
            return [Paragraph(lbl, self.styles[ls]), "", "", "", "",
                    Paragraph(val, self.styles[ls])]

        data.append(_sr("Subtotal:", f"\u20b9{subtotal:,.2f}"))
        if cgst_r: data.append(_sr(f"CGST @ {cgst_r:.0f}%:", f"\u20b9{cgst_a:,.2f}"))
        if sgst_r: data.append(_sr(f"SGST @ {sgst_r:.0f}%:", f"\u20b9{sgst_a:,.2f}"))
        if igst_r: data.append(_sr(f"IGST @ {igst_r:.0f}%:", f"\u20b9{igst_a:,.2f}"))
        data.append(_sr("Total Amount Due:", f"\u20b9{grand:,.2f}", bold=True))

        span_cmds = [("SPAN", (0, r), (4, r)) for r in range(n, len(data))]

        t = Table(data, colWidths=cw, repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,0),   NAVY),
            ("TEXTCOLOR",     (0,0),(-1,0),   WHITE),
            ("TOPPADDING",    (0,0),(-1,0),   HP), ("BOTTOMPADDING",(0,0),(-1,0),   HP),
            ("TOPPADDING",    (0,1),(-1,n-1), RP), ("BOTTOMPADDING",(0,1),(-1,n-1), RP),
            ("ROWBACKGROUNDS",(0,1),(-1,n-1), [WHITE, LIGHT_BG]),
            ("LINEBELOW",     (0,1),(-1,n-2), 0.3, GRID),
            ("BACKGROUND",    (0,n),(-1,-1),  WHITE),
            ("TOPPADDING",    (0,n),(-1,-1),  SP), ("BOTTOMPADDING",(0,n),(-1,-1), SP),
            *span_cmds,
            ("BACKGROUND",    (0,-1),(-1,-1), HDR_BG),
            ("TOPPADDING",    (0,-1),(-1,-1), HP), ("BOTTOMPADDING",(0,-1),(-1,-1), HP),
            ("LINEABOVE",     (0,-1),(-1,-1), 0.75, BORDER),
            ("LEFTPADDING",   (0,0),(-1,-1),  4), ("RIGHTPADDING", (0,0),(-1,-1), 4),
            ("BOX",           (0,0),(-1,-1),  0.75, BORDER),
            ("VALIGN",        (0,0),(-1,-1),  "MIDDLE"),
        ]))
        elems.append(t)
        return elems

    # ── S4: Taxes table ────────────────────────────────────────────────────────
    # Cols: HSN/SAC | Taxable Value | CGST | SGST | IGST | Amount
    def _taxes_table(self, items, U):
        elems = [Paragraph("Taxes", self.styles["SecHdr"])]

        AMT  = 1.05*inch          # matches items table last column
        HSN  = 0.80*inch
        CGST = 1.05*inch
        SGST = 1.05*inch
        IGST = 0.72*inch
        TVAL = U - HSN - CGST - SGST - IGST - AMT
        cw   = [HSN, TVAL, CGST, SGST, IGST, AMT]

        def _h(txt, al=TA_CENTER):
            return Paragraph(txt, ParagraphStyle("_th", parent=self.styles["Normal"],
                fontName=BLD, fontSize=7.5, textColor=WHITE, alignment=al, leading=10))

        # Defined once, outside the loop
        def _tc(v, r):
            if r == 0: return Paragraph("—", self.styles["TCC"])
            return Paragraph(f"₹{v:,.2f} ({r:.0f}%)", self.styles["TCC"])

        data = [[_h("HSN/SAC"), _h("Taxable Value"), _h("CGST"),
                 _h("SGST"), _h("IGST"), _h("Amount")]]

        groups: Dict[str, dict] = {}
        for item in items:
            hsn = str(item.get("hsn_sac", "—"))
            tv  = float(item.get("unit_price", 0)) * float(item.get("quantity", 1))
            if hsn not in groups:
                groups[hsn] = {"tv": 0,
                               "cgst": float(item.get("cgst_rate", 0)),
                               "sgst": float(item.get("sgst_rate", 0)),
                               "igst": float(item.get("igst_rate", 0))}
            groups[hsn]["tv"] += tv

        tv_tot = cg_tot = sg_tot = ig_tot = amt_tot = 0.0
        for hsn, g in groups.items():
            tv  = g["tv"]
            cg  = tv * g["cgst"] / 100
            sg  = tv * g["sgst"] / 100
            ig  = tv * g["igst"] / 100
            amt = tv + cg + sg + ig
            tv_tot += tv; cg_tot += cg; sg_tot += sg; ig_tot += ig; amt_tot += amt
            data.append([Paragraph(hsn,           self.styles["TCC"]),
                         Paragraph(f"₹{tv:,.2f}", self.styles["TCR"]),
                         _tc(cg, g["cgst"]), _tc(sg, g["sgst"]), _tc(ig, g["igst"]),
                         Paragraph(f"₹{amt:,.2f}", self.styles["TBR"])])

        data.append([Paragraph("Total:", self.styles["TBL"]),
                     Paragraph(f"₹{tv_tot:,.2f}", self.styles["TBR"]),
                     Paragraph(f"₹{cg_tot:,.2f}", self.styles["TBC"]),
                     Paragraph(f"₹{sg_tot:,.2f}", self.styles["TBC"]),
                     Paragraph(f"₹{ig_tot:,.2f}", self.styles["TBC"]),
                     Paragraph(f"₹{amt_tot:,.2f}", self.styles["TBR"])])

        t = Table(data, colWidths=cw, repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,0),   NAVY),
            ("TEXTCOLOR",     (0,0),(-1,0),   WHITE),
            ("TOPPADDING",    (0,0),(-1,0),   HP), ("BOTTOMPADDING",(0,0),(-1,0),   HP),
            ("TOPPADDING",    (0,1),(-1,-1),  RP), ("BOTTOMPADDING",(0,1),(-1,-1),  RP),
            ("LEFTPADDING",   (0,0),(-1,-1),  4),  ("RIGHTPADDING", (0,0),(-1,-1),  4),
            ("ROWBACKGROUNDS",(0,1),(-1,-2),  [WHITE, LIGHT_BG]),
            ("LINEBELOW",     (0,1),(-1,-2),  0.3, GRID),
            ("BACKGROUND",    (0,-1),(-1,-1), HDR_BG),
            ("LINEABOVE",     (0,-1),(-1,-1), 0.75, BORDER),
            ("BOX",           (0,0),(-1,-1),  0.75, BORDER),
            ("VALIGN",        (0,0),(-1,-1),  "MIDDLE"),
        ]))
        elems.append(t)
        return elems

    # ── S5: Financial summary (horizontal row) ─────────────────────────────────
    # Three equal cells side-by-side: Grand Total | Amount Paid | Balance Due
    def _financial_summary(self, items, order_data, U):
        subtotal = sum(
            float(i.get("unit_price", 0)) * float(i.get("quantity", 1)) for i in items)
        tax = sum(
            float(i.get("unit_price", 0)) * float(i.get("quantity", 1))
            * (float(i.get("cgst_rate", 0)) + float(i.get("sgst_rate", 0))
               + float(i.get("igst_rate", 0))) / 100
            for i in items)
        shipping   = float(order_data.get("shipping_amount", 0) or 0)
        order_disc = float(order_data.get("order_discount",  0) or 0)
        gross      = round(subtotal + tax + shipping - order_disc, 2)
        amount_paid= float(order_data.get("amount_paid", 0) or 0)
        balance    = max(0.0, round(gross - amount_paid, 2))

        # Integer-safe third-split: give any rounding remainder to the middle cell
        CW1     = int(U / 3)
        CW2     = int(U / 3)
        CW3     = U - CW1 - CW2
        INNER_W = CW1 - 12   # 6pt left + 6pt right cell padding

        def _cell(lbl, val, lbl_color=WHITE, val_color=WHITE):
            lp = Paragraph(lbl, ParagraphStyle("_fl", parent=self.styles["Normal"],
                fontName=BLD, fontSize=8, textColor=lbl_color,
                alignment=TA_CENTER, leading=11))
            vp = Paragraph(val, ParagraphStyle("_fv", parent=self.styles["Normal"],
                fontName=BLD, fontSize=12, textColor=val_color,
                alignment=TA_CENTER, leading=16))
            inner = Table([[lp], [vp]], colWidths=[INNER_W])
            inner.setStyle(TableStyle([
                ("LEFTPADDING",  (0,0),(-1,-1), 0), ("RIGHTPADDING", (0,0),(-1,-1), 0),
                ("TOPPADDING",   (0,0),(-1,-1), 1), ("BOTTOMPADDING",(0,0),(-1,-1), 1),
            ]))
            return inner

        DIVIDER = colors.HexColor("#4a6080")
        t = Table([[
            _cell("Grand Total",  f"₹{gross:,.2f}"),
            _cell("Amount Paid",  f"₹{amount_paid:,.2f}",
                  lbl_color=colors.HexColor("#b0c8e8")),
            _cell("Balance Due",  f"₹{balance:,.2f}"),
        ]], colWidths=[CW1, CW2, CW3])
        t.setStyle(TableStyle([
            ("BACKGROUND",   (0,0),(-1,-1), NAVY),
            ("TOPPADDING",   (0,0),(-1,-1), 8), ("BOTTOMPADDING",(0,0),(-1,-1), 8),
            ("LEFTPADDING",  (0,0),(-1,-1), 6), ("RIGHTPADDING", (0,0),(-1,-1), 6),
            ("VALIGN",       (0,0),(-1,-1), "MIDDLE"),
            ("LINEBEFORE",   (1,0),(1,-1),  0.5, DIVIDER),
            ("LINEBEFORE",   (2,0),(2,-1),  0.5, DIVIDER),
            ("BOX",          (0,0),(-1,-1), 0.75, BORDER),   # same as all other tables
        ]))
        return [t]

    # ── S6: Declaration block ──────────────────────────────────────────────────
    # Row 1: Amount in Words (full-width)
    # Row 2: Remarks | Declaration text
    def _declaration_block(self, items, order_data, U):
        grand = _grand_total(items, order_data)
        words = _amount_in_words(grand)

        lbl_s = ParagraphStyle("_dl", parent=self.styles["Normal"],
            fontName=BLD, fontSize=7,   textColor=MUTED, leading=10)
        txt_s = ParagraphStyle("_dt", parent=self.styles["Normal"],
            fontName=NRM, fontSize=7,   textColor=DARK,  leading=10)
        wrd_s = ParagraphStyle("_dw", parent=self.styles["Normal"],
            fontName=BLD, fontSize=7.5, textColor=DARK,  leading=11)

        rows = [
            [Paragraph("Amount in Words :", lbl_s), Paragraph(words, wrd_s), "", ""],
            [Paragraph("Remarks :", lbl_s),
             Paragraph("BEING GOODS SALES", txt_s),
             Paragraph("Declaration :", lbl_s),
             Paragraph("We declare that this invoice shows the actual price of the "
                       "goods described and that all particulars are true and correct.",
                       txt_s)],
        ]
        t = Table(rows, colWidths=[U*0.14, U*0.36, U*0.14, U*0.36])
        t.setStyle(TableStyle([
            ("SPAN",          (1,0),(3,0)),
            ("BOX",           (0,0),(-1,-1), 0.75, BORDER),   # matches all other tables
            ("LINEBELOW",     (0,0),(-1,0),  0.4,  GRID),
            ("LINEBEFORE",    (2,1),(2,1),   0.4,  GRID),
            ("BACKGROUND",    (0,0),(-1,-1), LIGHT_BG),
            ("TOPPADDING",    (0,0),(-1,-1), 4), ("BOTTOMPADDING",(0,0),(-1,-1), 4),
            ("LEFTPADDING",   (0,0),(-1,-1), 6), ("RIGHTPADDING", (0,0),(-1,-1), 6),
            ("VALIGN",        (0,0),(-1,-1), "TOP"),
        ]))
        return [t]

    # ── S7: Footer ─────────────────────────────────────────────────────────────
    def _footer(self, co):
        name  = co.get("name", "")
        parts = name.rsplit(" ", 1)
        bold  = f"{parts[0]} <b>{parts[1]}</b>" if len(parts) == 2 else f"<b>{name}</b>"
        return [
            HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=6),
            Paragraph("Thank you for your business!", self.styles["Ftr"]),
            Spacer(1, 3),
            HRFlowable(width=1.0*inch, thickness=2, color=NAVY,
                       hAlign="CENTER", spaceAfter=4),
            Paragraph(bold, self.styles["FtrB"]),
        ]


# ── Public helper ──────────────────────────────────────────────────────────────
def generate_simple_invoice(filepath: str, invoice_data: Dict[str, Any]) -> str:
    """Generate a professional GST Tax Invoice PDF. Returns filepath."""
    gen = TaxInvoiceGenerator(filepath)
    gen.generate_invoice(
        invoice_number = invoice_data["invoice_number"],
        invoice_date   = invoice_data.get("invoice_date", datetime.now(timezone.utc)),
        order_data     = invoice_data["order_data"],
        company_info   = invoice_data["company_info"],
        customer_info  = invoice_data["customer_info"],
        items          = invoice_data["items"],
        logo_path      = invoice_data.get("logo_path"),
        due_date       = invoice_data.get("due_date"),
    )
    return filepath