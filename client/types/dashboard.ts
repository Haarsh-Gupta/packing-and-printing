export interface Order {
    id: number;
    inquiry_id: number;
    total_amount: number;
    amount_paid: number;
    status: "PENDING" | "WAITING_PAYMENT" | "PARTIALLY_PAID" | "PAID" | "IN_PRODUCTION" | "PROCESSING" | "READY" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED";
    product_name?: string;
    quantity?: number;
    image_url?: string;
    created_at: string;
}

export interface Inquiry {
    id: number;
    template_id: number | null;
    service_id: number | null;
    variant_id: number | null;
    quantity: number;
    selected_options: Record<string, any>;
    notes: string | null;
    status: "PENDING" | "QUOTED" | "ACCEPTED" | "REJECTED";
    quoted_price: number | null;
    admin_notes: string | null;
    template_name?: string;
    service_name?: string;
    variant_name?: string;
    images?: string[];
    created_at: string;
}
