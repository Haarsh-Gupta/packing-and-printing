export interface SubProduct {
    id: number;
    product_id: number;
    slug: string;
    name: string;
    description?: string;
    type: string;
    base_price: number;
    minimum_quantity: number;
    is_active: boolean;
    images?: string[];
    features?: { icon: string; label: string; detail: string }[];
    specifications?: { label: string; value: string }[];
    created_at?: string;
}

export interface Product {
    id: number;
    slug: string;
    name: string;
    description?: string;
    cover_image?: string;
    is_active: boolean;
    created_at?: string;
    sub_products: SubProduct[];
}
