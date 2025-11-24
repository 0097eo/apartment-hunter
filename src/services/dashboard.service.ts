// src/services/dashboard.service.ts
import prisma from '../utils/prisma';
import { PropertyStatus, Listing, Viewing } from '@prisma/client';

export interface HunterStats {
    total_saved_properties: number;
    properties_by_status: { status: PropertyStatus; count: number }[];
    upcoming_viewings_count: number;
    next_viewing: Pick<Viewing, 'id' | 'scheduled_date' | 'scheduled_time' | 'location_notes'> | null;
    top_cities: { city: string; count: number }[];
}

export interface ListerStats {
    total_listings_posted: number;
    listings_by_status: { status: 'active' | 'inactive'; count: number }[];
    total_viewings_scheduled_on_my_listings: number;
    recent_activity: (Viewing & { listing: Pick<Listing, 'title'> })[];
}

export interface DashboardStats {
    hunter: HunterStats;
    lister: ListerStats;
}

/**
 * Retrieves all summary statistics for the authenticated user.
 */
export const getDashboardStats = async (userId: string): Promise<DashboardStats> => {
    // --- 1. HUNTER STATS ---

    // A. Total Saved Properties and Properties by Status (Single query)
    const savedProperties = await prisma.savedProperty.findMany({
        where: { user_id: userId },
        select: { 
            status: true,
            listing: {
                select: { city: true } // Need city for B
            }
        }
    });
    
    const total_saved_properties = savedProperties.length;
    
    // Aggregate by status and city from the single fetch
    const statusMap = savedProperties.reduce((acc, sp) => {
        acc[sp.status] = (acc[sp.status] || 0) + 1;
        return acc;
    }, {} as Record<PropertyStatus, number>);

    const cityMap = savedProperties.reduce((acc, sp) => {
        if (sp.listing?.city) {
            acc[sp.listing.city] = (acc[sp.listing.city] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const properties_by_status = Object.entries(statusMap).map(([status, count]) => ({
        status: status as PropertyStatus,
        count,
    }));

    const top_cities = Object.entries(cityMap)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Limit to top 5

    // B. Upcoming Viewings and Next Viewing
    const now = new Date();
    const upcomingViewings = await prisma.viewing.findMany({
        where: {
            user_id: userId,
            scheduled_date: { gte: now }, // Check date and time
            attended: false,
        },
        select: { 
            id: true, 
            scheduled_date: true, 
            scheduled_time: true, 
            location_notes: true 
        },
        orderBy: [{ scheduled_date: 'asc' }, { scheduled_time: 'asc' }],
    });

    const upcoming_viewings_count = upcomingViewings.length;
    const next_viewing = upcomingViewings.length > 0 ? upcomingViewings[0] : null;


    const hunterStats: HunterStats = {
        total_saved_properties,
        properties_by_status,
        upcoming_viewings_count,
        next_viewing,
        top_cities,
    };

    // --- 2. LISTER/AGENT STATS ---

    // A. Total Listings Posted and Listings by Status
    const total_listings_posted = await prisma.listing.count({
        where: { user_id: userId },
    });
    
    const active_count = await prisma.listing.count({
        where: { user_id: userId, is_active: true },
    });

    const inactive_count = total_listings_posted - active_count;

    const listings_by_status = [
        { status: 'active' as const, count: active_count },
        { status: 'inactive' as const, count: inactive_count },
    ];

    // B. Total Viewings Scheduled on My Listings & Recent Activity
    const myListings = await prisma.listing.findMany({
        where: { user_id: userId },
        select: { id: true, title: true },
    });

    const myListingsIds = myListings.map(l => l.id);

    const total_viewings_scheduled_on_my_listings = await prisma.viewing.count({
        where: { listing_id: { in: myListingsIds } },
    });

    const recent_viewings = await prisma.viewing.findMany({
        where: { listing_id: { in: myListingsIds } },
        include: {
            listing: {
                select: { title: true }
            }
        },
        orderBy: { created_at: 'desc' },
        take: 5,
    });
    
    const recent_activity = recent_viewings as (Viewing & { listing: Pick<Listing, 'title'> })[];


    const listerStats: ListerStats = {
        total_listings_posted,
        listings_by_status,
        total_viewings_scheduled_on_my_listings,
        recent_activity,
    };

    return {
        hunter: hunterStats,
        lister: listerStats,
    };
};