// ============ Auth ============
export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    phone?: string;
    admin: boolean;
    avatar_url?: string;
    profile_picture?: string;
    email_bounced?: boolean;
    created_at: string;
}

// ============ Dashboard ============
export interface Metric {
    total: number;
    change: string;
    trend: 'up' | 'down';
}

export interface DashboardOverview {
    users: Metric & { new_in_period: number; daily_trend: { date: string; count: number }[] };
    orders: Metric & { in_period: number; by_status: Record<string, number>; online_vs_offline?: { online: number; offline: number }; daily_trend: { date: string; value: number; count: number }[] };
    revenue: Metric & { total_billed: number; total_collected: number; total_pending: number; collected_in_period: number };
    inquiries: Metric & { pending: number; in_period: number; daily_trend: { date: string; count: number }[]; funnel?: { draft: number; submitted: number; quoted: number; accepted: number }; conversion_rate?: number };
    products: { total: number; active: number };
    services: { total: number; active: number };
    recent_reviews: Review[];
}

export interface TrafficStats {
    mobile: { count: number; percentage: number };
    desktop: { count: number; percentage: number };
    tablet: { count: number; percentage: number };
    total: number;
    daily_trend: { date: string; mobile: number; desktop: number; tablet: number }[];
}

export interface RevenueData {
    total_billed: number;
    total_collected: number;
    total_pending: number;
    payment_modes: Record<string, number>;
    daily_trend: { date: string; amount: number }[];
    top_unpaid: { order_id: number; amount: number; user_email: string }[];
}

export interface OrderStats {
    status_breakdown: Record<string, number>;
    avg_order_value: number;
    daily_trend: { date: string; count: number }[];
}

export interface InquiryStats {
    status_breakdown: Record<string, number>;
    conversion_rate: number;
    popular_products: { name: string; count: number }[];
}

export interface UserStats {
    total: number;
    new_signups: number;
    trend: { date: string; count: number }[];
    top_spenders: { name: string; total: number }[];
}

export interface ActivityItem {
    type: string;
    description: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}

// ============ Orders ============
export type OrderStatus = 
    | "WAITING_PAYMENT" 
    | "PARTIALLY_PAID" 
    | "PAID" 
    | "PROCESSING" 
    | "READY" 
    | "COMPLETED" 
    | "CANCELLED";

export interface Milestone {
    id: string;
    order_id: string;
    label: string;
    amount: number;
    percentage: number;
    order_index: number;
    status: string;
    paid_at?: string;
}

export interface PaymentDeclaration {
    id: string;
    order_id: string;
    milestone_id: string;
    user_id: string;
    payment_mode: string;
    utr_number?: string;
    screenshot_url?: string;
    status: string;
    rejection_reason?: string;
    created_at: string;
    reviewed_at?: string;
}

export interface Transaction {
    id: string;
    display_id?: string;
    order_id: string;
    amount: number;
    payment_mode: string;
    created_at: string;
    notes?: string;
    gateway_payment_id?: string;
}

export interface Order {
    id: string;
    order_number?: string;
    inquiry_id: string;
    user_id: string;
    total_amount: number;
    amount_paid: number;
    status: OrderStatus;
    product_name?: string;
    payment_id?: string;
    created_at: string;
    updated_at: string;
    milestones?: Milestone[];
    transactions?: Transaction[];
    declarations?: PaymentDeclaration[];
}

export interface AdminOfflineOrderCreateItem {
    product_id?: number;
    sub_product_id?: number;
    service_id?: number;
    sub_service_id?: number;
    name: string;
    quantity: number;
    unit_price: number;
}

export interface AdminOfflineOrderCreateRequest {
    user_id: string;
    items: AdminOfflineOrderCreateItem[];
    tax_amount: number;
    shipping_amount: number;
    discount_amount: number;
    split_type: "FULL" | "HALF" | "CUSTOM";
    milestones?: { label: string; percentage: number }[];
}

// ============ Inquiries ============
export interface InquiryItem {
    id: string;
    inquiry_group_id?: string;
    product_id?: number;
    subproduct_id?: number;
    service_id?: number;
    subservice_id?: number;
    quantity: number;
    selected_options: Record<string, unknown>;
    notes?: string;
    images?: string[];
    display_images?: string[];
    line_item_price?: number;
    estimated_price?: number;
    total_estimated_price?: number;
    product_name?: string;
    subproduct_name?: string;
    service_name?: string;
    subservice_name?: string;
    variant_name?: string;
    cgst_rate?: number;
    sgst_rate?: number;
    hsn_code?: string;
    computed_tax_amount?: number;
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
    inquiry_id: string;
    version: number;
    total_price: number;
    valid_until: string;
    admin_notes?: string;
    milestones?: { label: string; percentage: number; description?: string }[];
    line_items?: Record<string, unknown>[];
    status: string;
    created_at: string;
}

export interface InquiryGroup {
    id: string;
    display_id?: string;
    user_id: string;
    status: string;
    active_quote_id?: string;
    active_quote?: QuoteVersion;
    quote_versions?: QuoteVersion[];
    created_at: string;
    updated_at: string;
    items: InquiryItem[];
    messages: InquiryMessage[];
    quote_email_status?: string;
    admin_notes?: string;
}

export interface InquiryGroupList {
    id: string;
    display_id?: string;
    user_id: string;
    status: string;
    active_quote?: { total_price: number };
    created_at: string;
    item_count: number;
}

// ============ Products ============
export interface ProductOption {
    label: string;
    value: string;
    price_mod: number;
}

export interface FormSection {
    key: string;
    label: string;
    type: "dropdown" | "radio" | "number_input" | "text_input";
    options?: ProductOption[];
    min_val?: number;
    max_val?: number;
    default_val?: number;
    price_per_unit?: number;
}

export interface SubProduct {
    id: number;
    product_id: number;
    slug: string;
    name: string;
    description?: string;
    type: string;
    base_price: number;
    minimum_quantity: number;
    images?: string[];
    features?: { icon: string; label: string; detail: string }[];
    specifications?: { label: string; value: string }[];
    is_active: boolean;
    hsn_code?: string;
    cgst_rate?: number;
    sgst_rate?: number;
    config_schema: { sections: FormSection[] };
    created_at: string;
}

export interface Product {
    id: number;
    slug: string;
    name: string;
    description?: string;
    cover_image?: string;
    is_active: boolean;
    created_at: string;
    sub_products: SubProduct[];
}

// ============ Services ============
export interface SubService {
    id: number;
    service_id: number;
    name: string;
    slug: string;
    minimum_quantity: number;
    price_per_unit: number;
    description?: string;
    images?: string[];
    features?: { icon: string; label: string; detail: string }[];
    specifications?: { label: string; value: string }[];
    is_active: boolean;
    hsn_code?: string;
    cgst_rate?: number;
    sgst_rate?: number;
}

export interface Service {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    cover_image?: string;
    description?: string;
    sub_services: SubService[];
}

// ============ Users ============
export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    admin: boolean;
    avatar_url?: string;
    profile_picture?: string;
    email_bounced?: boolean;
    created_at?: string;
}

// ============ Tickets ============
export interface TicketMessage {
    id: number;
    ticket_id: number;
    sender_id: string;
    message: string;
    is_admin: boolean;
    is_read: boolean;
    created_at: string;
}

export interface Ticket {
    id: number;
    display_id?: string;
    user_id: string;
    subject: string;
    description: string;
    priority: string;
    status: string;
    created_at: string;
    updated_at: string;
    messages?: TicketMessage[];
}

// ============ Notifications ============
export interface Notification {
    id: number;
    user_id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

// ============ Reviews ============
export interface Review {
    id: number;
    user_id: string;
    product_id?: number | null;
    service_id?: number | null;
    rating: number;
    comment: string;
    user_name?: string;
    product_name?: string;
    is_verified: boolean;
    created_at: string;
    user?: { name: string; avatar_url?: string; profile_picture?: string };
    product?: { id: number; name: string; product_id: number };
    service?: { id: number; name: string; service_id: number };
}

export interface ReviewListResponse {
    total: number;
    skip: number;
    limit: number;
    reviews: Review[];
}
