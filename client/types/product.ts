export interface Product {
    id: number;
    slug: string;
    name: string;
    base_price: number;
    description?: string;
    images?: string[];
}
