export interface Order {
    id: string;
    inquiry_id: string;
    total_amount: number;
    amount_paid: number;
    status: "PENDING" | "WAITING_PAYMENT" | "PARTIALLY_PAID" | "PAID" | "IN_PRODUCTION" | "PROCESSING" | "READY" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED";
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

export interface Inquiry {
    id: string;
    user_id: string;
    status: "PENDING" | "QUOTED" | "ACCEPTED" | "REJECTED";
    total_quoted_price?: number | null;
    admin_notes?: string | null;
    quoted_at?: string | null;
    quote_valid_until?: string | null;
    created_at: string;
    updated_at: string;
    items?: InquiryItem[];
    messages?: InquiryMessage[];
}
