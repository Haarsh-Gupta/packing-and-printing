export interface SubService {
    id: number;
    service_id?: number;
    name: string;
    slug: string;
    base_price: number;
    price_per_unit: number;
    description: string | null;
    images?: string[];
    is_active?: boolean;
}

export interface ServiceItem {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    cover_image: string | null;
    sub_services: SubService[];
}
