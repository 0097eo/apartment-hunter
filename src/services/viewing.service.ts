import prisma from '../utils/prisma';
import { Viewing, Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/customErrors';

/**
 * Schedules a new viewing for a listing.
 */
export const scheduleViewing = async (
    userId: string,
    listingId: string,
    data: { 
        scheduled_date: Date, 
        scheduled_time?: Date, 
        duration_minutes?: number, 
        location_notes?: string 
    }
): Promise<Viewing> => {
    
    // Validate Listing existence and active status
    const listing = await prisma.listing.findUnique({
        where: { id: listingId, is_active: true },
        select: { id: true },
    });

    if (!listing) {
        throw new NotFoundError('Listing not found or is inactive.');
    }

    // Find optional SavedProperty ID for quick linking (if exists)
    const savedProperty = await prisma.savedProperty.findFirst({ 
        where: { 
            user_id: userId, 
            listing_id: listingId 
        }, 
        select: { id: true },
    });

    // Create Viewing record
    const newViewing = await prisma.viewing.create({
        data: {
            user_id: userId,
            listing_id: listingId,
            scheduled_date: new Date(data.scheduled_date), // Ensure date object
            scheduled_time: data.scheduled_time ? new Date(data.scheduled_time) : null,
            duration_minutes: data.duration_minutes,
            location_notes: data.location_notes,
            saved_property_id: savedProperty?.id,
        },
    });

    return newViewing;
};

/**
 * Gets all viewings for the authenticated Hunter with filtering and sorting.
 */
export const getHunterViewings = async (
    userId: string, 
    filter: { attended?: boolean, listing_id?: string },
    sortBy: 'date_asc' | 'date_desc' = 'date_asc'
) => {
    
    const where: Prisma.ViewingWhereInput = {
        user_id: userId,
        ...(filter.attended !== undefined && { attended: filter.attended }),
        ...(filter.listing_id && { listing_id: filter.listing_id }),
    };

    const viewings = await prisma.viewing.findMany({
        where,
        include: {
            listing: {
                select: { id: true, title: true, address: true, city: true, image_urls: true, price: true }
            },
        },
        orderBy: {
            scheduled_date: sortBy === 'date_asc' ? 'asc' : 'desc',
        },
    });

    return viewings;
};

/**
 * Retrieves the next N upcoming viewings for the Hunter.
 */
export const getUpcomingViewings = async (userId: string, limit: number = 5) => {
    
    const now = new Date();
    // Set 'now' to start of day for accurate comparison if time is not included in query
    now.setHours(0, 0, 0, 0); 
    
    const upcomingViewings = await prisma.viewing.findMany({
        where: {
            user_id: userId,
            // Filter for viewings in the future
            OR: [
                { scheduled_date: { gt: now } }, // Dates strictly in the future
                // If scheduled_date is today, ensure it's not attended
                { scheduled_date: { equals: now }, attended: false } 
            ],
            attended: false,
        },
        include: {
            listing: {
                select: { id: true, title: true, address: true, image_urls: true }
            },
        },
        orderBy: [
            { scheduled_date: 'asc' }, 
            { scheduled_time: 'asc' }
        ],
        take: limit,
    });

    return upcomingViewings;
};


/**
 * Updates a viewing's details, notes, or attended status.
 */
export const updateViewing = async (
    viewingId: string, 
    userId: string, 
    updateData: {
        scheduled_date?: Date, 
        scheduled_time?: Date, 
        duration_minutes?: number, 
        location_notes?: string, 
        attended?: boolean, 
        viewing_notes?: string, 
        rating?: number
    }
): Promise<Viewing> => {
    
    const existingViewing = await prisma.viewing.findUnique({ where: { id: viewingId } });

    if (!existingViewing) {
        throw new NotFoundError('Viewing appointment not found.');
    }

    if (existingViewing.user_id !== userId) {
        throw new ForbiddenError('You can only update your own viewings.');
    }

    const updatedViewing = await prisma.viewing.update({
        where: { id: viewingId },
        data: {
            // Apply only non-undefined update fields, converting strings to Dates if necessary
            scheduled_date: updateData.scheduled_date ? new Date(updateData.scheduled_date) : undefined,
            scheduled_time: updateData.scheduled_time ? new Date(updateData.scheduled_time) : undefined,
            duration_minutes: updateData.duration_minutes,
            location_notes: updateData.location_notes,
            attended: updateData.attended,
            viewing_notes: updateData.viewing_notes,
            rating: updateData.rating,
        },
    });

    return updatedViewing;
};

/**
 * Deletes a viewing appointment (cancellation).
 */
export const deleteViewing = async (viewingId: string, userId: string): Promise<void> => {
    
    const existingViewing = await prisma.viewing.findUnique({ where: { id: viewingId } });

    if (!existingViewing) {
        throw new NotFoundError('Viewing appointment not found.');
    }

    if (existingViewing.user_id !== userId) {
        throw new ForbiddenError('You can only delete your own viewings.');
    }

    await prisma.viewing.delete({ where: { id: viewingId } });
};