export interface SubService {
    id: number;
    service_id?: number;
    name: string;
    slug: string;
    minimum_quantity: number;
    price_per_unit: number;
    description: string | null;
    images?: string[];
    features?: { icon: string; label: string; detail: string }[];
    specifications?: { label: string; value: string }[];
    is_active?: boolean;
}

export interface ServiceItem {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    cover_image: string | null;
    images?: string[];
    sub_services: SubService[];
}
