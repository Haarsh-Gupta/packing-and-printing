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
    created_at: string;
}

// ============ Dashboard ============
export interface DashboardOverview {
    users: { total: number; new_in_period: number };
    orders: { total: number; in_period: number; by_status: Record<string, number> };
    revenue: { total_billed: number; total_collected: number; total_pending: number; collected_in_period: number };
    inquiries: { total: number; pending: number; in_period: number };
    products: { total: number; active: number };
    services: { total: number; active: number };
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
export interface Transaction {
    id: string;
    order_id: string;
    amount: number;
    payment_mode: string;
    created_at: string;
    notes?: string;
    gateway_payment_id?: string;
}

export interface Order {
    id: string;
    inquiry_id: string;
    user_id: string;
    total_amount: number;
    amount_paid: number;
    status: string;
    product_name?: string;
    payment_id?: string;
    created_at: string;
    updated_at: string;
    transactions?: Transaction[];
}

// ============ Inquiries ============
export interface InquiryItem {
    id: string;
    inquiry_group_id?: string;
    template_id?: number;
    service_id?: number;
    variant_id?: number;
    quantity: number;
    selected_options: Record<string, unknown>;
    notes?: string;
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

export interface InquiryGroup {
    id: string;
    user_id: string;
    status: string;
    total_quoted_price?: number;
    admin_notes?: string;
    quoted_at?: string;
    quote_valid_until?: string;
    created_at: string;
    updated_at: string;
    items: InquiryItem[];
    messages: InquiryMessage[];
}

export interface InquiryGroupList {
    id: string;
    user_id: string;
    status: string;
    total_quoted_price?: number;
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
    price_per_unit?: number;
}

export interface Product {
    id: number;
    slug: string;
    name: string;
    type: string;
    base_price: number;
    minimum_quantity: number;
    images?: string[];
    is_active: boolean;
    config_schema: { sections: FormSection[] };
}

// ============ Services ============
export interface ServiceVariant {
    id: number;
    service_id: number;
    name: string;
    slug: string;
    base_price: number;
    price_per_unit: number;
    description?: string;
}

export interface Service {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    variants: ServiceVariant[];
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
    product_id: number;
    rating: number;
    comment: string;
    is_verified: boolean;
    created_at: string;
    user?: { name: string; avatar_url?: string };
}
