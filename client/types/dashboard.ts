export interface Order {
    id: string;
    order_number?: string;
    inquiry_id: string;
    total_amount: number;
    amount_paid: number;
    status: "WAITING_PAYMENT" | "PARTIALLY_PAID" | "PAID" | "PROCESSING" | "READY" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    product_name?: string;
    quantity?: number;
    image_url?: string;
    created_at: string;
}

export interface InquiryItem {
    id: string;
    inquiry_group_id?: string;
    product_id?: number | null;
    subproduct_id?: number | null;
    service_id?: number | null;
    subservice_id?: number | null;
    template_id?: number | null;
    variant_id?: number | null;
    quantity: number;
    selected_options: Record<string, any>;
    notes?: string | null;
    images?: string[];
    display_images?: string[];
    line_item_price?: number;
    estimated_price?: number;
    total_estimated_price?: number;
    computed_tax_amount?: number;
    cgst_rate?: number;
    sgst_rate?: number;
    hsn_code?: string | null;
    product_name?: string;
    subproduct_name?: string;
    template_name?: string;
    service_name?: string;
    subservice_name?: string;
    variant_name?: string;
}

export interface InquiryMessage {
    id: number;
    inquiry_group_id: string;
    sender_id: string;
    content: string;
    file_urls?: string[];
    created_at: string;
}

export interface QuoteVersion {
    id: string;
    display_id?: string;
    inquiry_id: string;
    version: number;
    total_price: number;
    tax_amount?: number;
    discount_amount?: number;
    shipping_amount?: number;
    admin_notes?: string;
    valid_until: string;
    created_at: string;
    line_items?: Record<string, unknown>[];
}

export interface Inquiry {
    id: string;
    display_id?: string;
    user_id: string;
    status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "NEGOTIATING" | "QUOTED" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";
    active_quote_id?: string;
    active_quote?: QuoteVersion;
    admin_notes?: string;
    created_at: string;
    updated_at: string;
    items?: InquiryItem[];
    messages?: InquiryMessage[];
    quote_versions?: QuoteVersion[];
}
