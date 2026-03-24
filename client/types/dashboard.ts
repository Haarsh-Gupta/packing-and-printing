export interface Order {
    id: string;
    order_number?: string;
    inquiry_id: string;
    total_amount: number;
    amount_paid: number;
    status: "WAITING_PAYMENT" | "PARTIALLY_PAID" | "PAID" | "PROCESSING" | "READY" | "COMPLETED" | "CANCELLED";
    product_name?: string;
    quantity?: number;
    image_url?: string;
    created_at: string;
}

export interface InquiryItem {
    id: string;
    inquiry_group_id?: string;
    template_id?: number | null;
    service_id?: number | null;
    variant_id?: number | null;
    quantity: number;
    selected_options: Record<string, any>;
    notes?: string | null;
    images?: string[];
    display_images?: string[];
    line_item_price?: number;
    template_name?: string;
    service_name?: string;
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
    version_number: number;
    total_price: number;
    admin_notes?: string;
    valid_until: string;
    created_at: string;
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
