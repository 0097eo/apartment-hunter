import { PropertyStatus, PropertyType } from "@prisma/client";

export interface PropertyFilter {
    status?: PropertyStatus;
    city?: string;
    county?: string;
    min_price?: number;
    max_price?: number;
    bedrooms?: number; // Exact match or min_bedrooms
    min_bedrooms?: number;
    min_bathrooms?: number;
    property_type?: PropertyType[];
    page?: number;
    limit?: number;
    sort?: string; // price_asc, newest, etc.
}

export interface Pagination{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}