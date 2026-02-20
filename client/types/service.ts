export interface ServiceVariant {
    id: number;
    name: string;
    slug: string;
    base_price: number;
    price_per_unit: number;
    description: string | null;
}

export interface ServiceItem {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    variants: ServiceVariant[];
}
