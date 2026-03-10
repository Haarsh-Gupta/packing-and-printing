export interface SubService {
    id: number;
    service_id?: number;
    name: string;
    slug: string;
    minimum_quantity: number;
    price_per_unit: number;
    description: string | null;
    images?: string[];
    is_active?: boolean;
}

export interface ServiceItem {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    is_active: boolean;
    cover_image: string | null;
    sub_services: SubService[];
}
