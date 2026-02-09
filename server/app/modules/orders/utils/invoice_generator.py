from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
from typing import Optional, Dict, Any
import base64
from io import BytesIO


class InvoiceGenerator:
    """Generate professional PDF invoices"""
    
    def __init__(self, filename: str, pagesize=A4):
        self.filename = filename
        self.pagesize = pagesize
        self.width, self.height = pagesize
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='InvoiceTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='CompanyName',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=6
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor('#34495e'),
            spaceAfter=12,
            spaceBefore=12
        ))
    
    def generate_invoice(
        self,
        invoice_number: str,
        invoice_date: datetime,
        order_data: Dict[str, Any],
        company_info: Dict[str, str],
        customer_info: Dict[str, str],
        items: list,
        qr_code_base64: Optional[str] = None
    ):
        """
        Generate a complete invoice PDF
        
        Args:
            invoice_number: Invoice number
            invoice_date: Invoice date
            order_data: Order details (total, paid, due, etc.)
            company_info: Company details (name, address, phone, email, GSTIN)
            customer_info: Customer details (name, email, phone, address)
            items: List of invoice items
            qr_code_base64: Optional base64 QR code for payment
        """
        doc = SimpleDocTemplate(
            self.filename,
            pagesize=self.pagesize,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        
        story = []
        
        # Header
        story.extend(self._create_header(company_info, invoice_number, invoice_date))
        story.append(Spacer(1, 0.3*inch))
        
        # Customer Info
        story.extend(self._create_customer_section(customer_info))
        story.append(Spacer(1, 0.3*inch))
        
        # Invoice Items Table
        story.extend(self._create_items_table(items))
        story.append(Spacer(1, 0.2*inch))
        
        # Totals
        story.extend(self._create_totals_section(order_data))
        story.append(Spacer(1, 0.3*inch))
        
        # Payment QR Code if provided
        if qr_code_base64:
            story.extend(self._create_qr_section(qr_code_base64))
        
        # Footer
        story.extend(self._create_footer(company_info))
        
        # Build PDF
        doc.build(story)
    
    def _create_header(self, company_info: Dict[str, str], invoice_number: str, invoice_date: datetime):
        """Create invoice header"""
        elements = []
        
        # Company name
        company_name = Paragraph(company_info.get('name', 'Company Name'), self.styles['CompanyName'])
        elements.append(company_name)
        
        # Company details
        company_details = f"""
        <font size=9>
        {company_info.get('address', 'Address')}<br/>
        Phone: {company_info.get('phone', 'N/A')} | Email: {company_info.get('email', 'N/A')}<br/>
        {f"GSTIN: {company_info['gstin']}" if company_info.get('gstin') else ''}
        </font>
        """
        elements.append(Paragraph(company_details, self.styles['Normal']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Invoice title and details
        invoice_title = Paragraph("INVOICE", self.styles['InvoiceTitle'])
        elements.append(invoice_title)
        
        invoice_details = f"""
        <font size=10>
        <b>Invoice Number:</b> {invoice_number}<br/>
        <b>Date:</b> {invoice_date.strftime('%d %B %Y')}
        </font>
        """
        elements.append(Paragraph(invoice_details, self.styles['Normal']))
        
        return elements
    
    def _create_customer_section(self, customer_info: Dict[str, str]):
        """Create customer information section"""
        elements = []
        
        bill_to = Paragraph("<b>Bill To:</b>", self.styles['SectionHeader'])
        elements.append(bill_to)
        
        customer_details = f"""
        <font size=10>
        <b>{customer_info.get('name', 'Customer Name')}</b><br/>
        {customer_info.get('email', 'N/A')}<br/>
        {customer_info.get('phone', 'N/A')}<br/>
        {customer_info.get('address', '')}
        </font>
        """
        elements.append(Paragraph(customer_details, self.styles['Normal']))
        
        return elements
    
    def _create_items_table(self, items: list):
        """Create invoice items table"""
        elements = []
        
        # Table header
        table_data = [
            ['#', 'Description', 'Quantity', 'Unit Price', 'Total']
        ]
        
        # Add items
        for idx, item in enumerate(items, 1):
            table_data.append([
                str(idx),
                item.get('description', ''),
                str(item.get('quantity', 0)),
                f"₹{item.get('unit_price', 0):.2f}",
                f"₹{item.get('total', 0):.2f}"
            ])
        
        # Create table
        table = Table(table_data, colWidths=[0.5*inch, 3.5*inch, 1*inch, 1.2*inch, 1.2*inch])
        
        # Style table
        table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            
            # Body
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),
            ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            
            # Alternating rows
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.beige]),
        ]))
        
        elements.append(table)
        
        return elements
    
    def _create_totals_section(self, order_data: Dict[str, Any]):
        """Create totals section"""
        elements = []
        
        totals_data = [
            ['', 'Subtotal:', f"₹{order_data.get('subtotal', order_data.get('total_amount', 0)):.2f}"],
        ]
        
        if order_data.get('tax', 0) > 0:
            totals_data.append(['', f"Tax ({order_data.get('tax_rate', 0)}%):", f"₹{order_data.get('tax', 0):.2f}"])
        
        if order_data.get('discount', 0) > 0:
            totals_data.append(['', 'Discount:', f"-₹{order_data.get('discount', 0):.2f}"])
        
        totals_data.append(['', '<b>Total Amount:</b>', f"<b>₹{order_data.get('total_amount', 0):.2f}</b>"])
        totals_data.append(['', 'Amount Paid:', f"₹{order_data.get('amount_paid', 0):.2f}"])
        totals_data.append(['', '<b>Amount Due:</b>', f"<b>₹{order_data.get('total_amount', 0) - order_data.get('amount_paid', 0):.2f}</b>"])
        
        # Convert to Paragraphs for bold support
        for row in totals_data:
            row[1] = Paragraph(row[1], self.styles['Normal'])
            row[2] = Paragraph(row[2], self.styles['Normal'])
        
        totals_table = Table(totals_data, colWidths=[3.5*inch, 2*inch, 1.9*inch])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, -2), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LINEABOVE', (1, -3), (-1, -3), 1, colors.black),
            ('LINEABOVE', (1, -1), (-1, -1), 2, colors.black),
        ]))
        
        elements.append(totals_table)
        
        return elements
    
    def _create_qr_section(self, qr_code_base64: str):
        """Create QR code payment section"""
        elements = []
        
        elements.append(Spacer(1, 0.2*inch))
        elements.append(Paragraph("<b>Scan to Pay:</b>", self.styles['SectionHeader']))
        
        # Decode base64 and create image
        img_data = base64.b64decode(qr_code_base64)
        img = Image(BytesIO(img_data), width=1.5*inch, height=1.5*inch)
        
        elements.append(img)
        
        return elements
    
    def _create_footer(self, company_info: Dict[str, str]):
        """Create invoice footer"""
        elements = []
        
        elements.append(Spacer(1, 0.4*inch))
        
        footer_text = """
        <font size=8>
        <b>Terms & Conditions:</b><br/>
        1. Payment is due within 30 days of invoice date.<br/>
        2. Please include invoice number with payment.<br/>
        3. Late payments may incur additional charges.<br/>
        <br/>
        Thank you for your business!
        </font>
        """
        elements.append(Paragraph(footer_text, self.styles['Normal']))
        
        return elements


def generate_simple_invoice(
    filepath: str,
    invoice_data: Dict[str, Any]
) -> str:
    """
    Simple wrapper to generate invoice
    
    Args:
        filepath: Path to save PDF
        invoice_data: Complete invoice data
    
    Returns:
        Path to generated PDF
    """
    generator = InvoiceGenerator(filepath)
    
    generator.generate_invoice(
        invoice_number=invoice_data['invoice_number'],
        invoice_date=invoice_data.get('invoice_date', datetime.now()),
        order_data=invoice_data['order_data'],
        company_info=invoice_data['company_info'],
        customer_info=invoice_data['customer_info'],
        items=invoice_data['items'],
        qr_code_base64=invoice_data.get('qr_code')
    )
    
    return filepath