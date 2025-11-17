import prisma from '../utils/prisma';
import { PropertyStatus, Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/customErrors';

/**
 * Saves a Public Listing to the Hunter's list.
 */
export const saveListing = async (userId: string, listingId: string): Promise<any> => {
    const listing = await prisma.listing.findUnique({
        where: { id: listingId, is_active: true },
        select: { id: true, is_active: true },
    });

    if (!listing) {
        throw new NotFoundError('Listing not found or is inactive.');
    }

    try {
        const savedProperty = await prisma.savedProperty.create({
            data: {
                user_id: userId,
                listing_id: listingId,
                status: PropertyStatus.saved,
                pros: [],
                cons: [],
            },
            include: {
                listing: true,
            }
        });

        return savedProperty;
    } catch (error) {
        // Handle Prisma unique constraint violation (duplicate save)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new ValidationError('This listing is already in your saved list.');
        }
        throw error;
    }
};

/**
 * Gets all SavedProperties for the authenticated Hunter with filtering/pagination.
 */
export const getSavedProperties = async (
    userId: string, 
    filter: { status?: PropertyStatus, city?: string, county?: string, minPrice?: number, maxPrice?: number, bedrooms?: number },
    page: number = 1, 
    limit: number = 10,
    sortBy: 'price_asc' | 'price_desc' | 'newest' = 'newest'
) => {
    const skip = (page - 1) * limit;

    const where: Prisma.SavedPropertyWhereInput = {
        user_id: userId,
        ...(filter.status && { status: filter.status }),
        listing: {
            is_active: true, // Only show active listings
            ...(filter.city && { city: { equals: filter.city, mode: 'insensitive' } }),
            ...(filter.county && { county: { equals: filter.county, mode: 'insensitive' } }),
            ...(filter.bedrooms && { bedrooms: filter.bedrooms }),
            ...(filter.minPrice || filter.maxPrice ? {
                price: {
                    ...(filter.minPrice && { gte: new Prisma.Decimal(filter.minPrice) }),
                    ...(filter.maxPrice && { lte: new Prisma.Decimal(filter.maxPrice) }),
                }
            } : {})
        }
    };
    
    // Determine ordering for the joined Listing table
    let orderBy: Prisma.SavedPropertyOrderByWithRelationInput = { created_at: 'desc' };
    if (sortBy.startsWith('price')) {
        orderBy = { listing: { price: sortBy === 'price_asc' ? 'asc' : 'desc' } };
    } else if (sortBy === 'newest') {
        orderBy = { created_at: 'desc' };
    }


    const [savedProperties, totalCount] = await prisma.$transaction([
        prisma.savedProperty.findMany({
            where,
            include: { 
                listing: true, 
                tags: {
                    include: { tag: true },
                    orderBy: { tag: { name: 'asc' } }
                },
            },
            orderBy,
            skip,
            take: limit,
        }),
        prisma.savedProperty.count({ where }),
    ]);

    const results = savedProperties.map(sp => ({
        ...sp,
        tags: sp.tags.map(spt => spt.tag) // Flatten the tags structure
    }))

    return {
        savedProperties: results,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
    };
};

/**
 * Gets a single SavedProperty detail.
 */
export const getSavedPropertyById = async (savedPropertyId: string, userId: string): Promise<any> => {
    const savedProperty = await prisma.savedProperty.findUnique({
        where: { id: savedPropertyId },
        include: {
            listing: true,
            viewings: {
                where: { user_id: userId }, 
                orderBy: { scheduled_date: 'asc' },
            },
            tags: {
                include: { tag: true },
                orderBy: { tag: { name: 'asc' } }
            },
        },
    });

    if (!savedProperty) {
        throw new NotFoundError('Saved property not found.');
    }

    if (savedProperty.user_id !== userId) {
        throw new ForbiddenError('You can only view your own saved properties.');
    }
    
    // Flatten tags
    const result = {
        ...savedProperty,
        tags: savedProperty.tags.map(spt => spt.tag)
    }

    return result;
};

/**
 * Updates a Hunter's private notes/status on a SavedProperty.
 */
export const updateSavedProperty = async (
    savedPropertyId: string, 
    userId: string, 
    updateData: { notes?: string, pros?: string[], cons?: string[], status?: PropertyStatus }
): Promise<any> => {
    
    const existingSave = await prisma.savedProperty.findUnique({
        where: { id: savedPropertyId },
    });

    if (!existingSave) {
        throw new NotFoundError('Saved property not found.');
    }

    if (existingSave.user_id !== userId) {
        throw new ForbiddenError('You can only update your own saved properties.');
    }

    const updatedSave = await prisma.savedProperty.update({
        where: { id: savedPropertyId },
        data: updateData,
        include: {
            listing: true,
            tags: {
                include: { tag: true },
                orderBy: { tag: { name: 'asc' } }
            },
        }
    });

    const result = {
        ...updatedSave,
        tags: updatedSave.tags.map(spt => spt.tag)
    }

    return result;
};

/**
 * Removes a property from the Hunter's list (deletes SavedProperty and cascading Viewings).
 */
export const deleteSavedProperty = async (savedPropertyId: string, userId: string): Promise<void> => {
    const existingSave = await prisma.savedProperty.findUnique({
        where: { id: savedPropertyId },
    });

    if (!existingSave) {
        throw new NotFoundError('Saved property not found.');
    }

    if (existingSave.user_id !== userId) {
        throw new ForbiddenError('You can only delete your own saved properties.');
    }

    // Cascade delete handles Viewings and SavedPropertyTags automatically
    await prisma.savedProperty.delete({ where: { id: savedPropertyId } });
};