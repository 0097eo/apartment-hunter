import prisma from '../utils/prisma';
import { Comparison, Listing, Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/customErrors';

type DetailedComparison = Comparison & { 
    listings: (Listing & { price_per_sqft?: number })[] 
};

/**
 * Validates listing IDs and fetches their details, calculating price_per_sqft.
 */
const getDetailedListings = async (listingIds: string[]): Promise<(Listing & { price_per_sqft?: number })[]> => {
    if (listingIds.length === 0) {
        return [];
    }

    const listings = await prisma.listing.findMany({
        where: {
            id: { in: listingIds },
            is_active: true,
        },
    });

    if (listings.length !== listingIds.length) {
        throw new ValidationError('One or more Listing IDs were not found or are inactive.');
    }
    
    // Maintain the order of the input array
    const orderedListings = listingIds
        .map(id => listings.find(l => l.id === id))
        .filter((l): l is Listing => l !== undefined);

    const detailedListings = orderedListings.map(l => {
        const pricePerSqft = l.square_feet && l.square_feet > 0 
            ? l.price.toNumber() / l.square_feet
            : undefined;

        return {
            ...l,
            price_per_sqft: pricePerSqft,
        };
    });

    return detailedListings;
};

/**
 * Creates a new comparison set.
 */
export const createComparison = async (userId: string, name: string, listingIds: string[]): Promise<DetailedComparison> => {
    
    if (listingIds.length < 2) {
        throw new ValidationError('A comparison requires at least two listings.');
    }

    // This also validates the Listing IDs
    const detailedListings = await getDetailedListings(listingIds);

    const newComparison = await prisma.comparison.create({
        data: {
            user_id: userId,
            name,
            listing_ids: listingIds,
        },
    });

    return { ...newComparison, listings: detailedListings };
};

/**
 * Lists all saved comparisons for the Hunter.
 */
export const getHunterComparisons = async (userId: string): Promise<Comparison[]> => {
    const comparisons = await prisma.comparison.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
    });
    return comparisons;
};

/**
 * Gets a detailed comparison with full listing details and stats.
 */
export const getDetailedComparison = async (comparisonId: string, userId: string): Promise<DetailedComparison> => {
    const comparison = await prisma.comparison.findUnique({
        where: { id: comparisonId },
    });

    if (!comparison) {
        throw new NotFoundError('Comparison not found.');
    }

    if (comparison.user_id !== userId) {
        throw new ForbiddenError('You can only view your own comparisons.');
    }

    const detailedListings = await getDetailedListings(comparison.listing_ids);

    return { ...comparison, listings: detailedListings };
};

/**
 * Updates a comparison's name or listing IDs.
 */
export const updateComparison = async (
    comparisonId: string, 
    userId: string, 
    updateData: { name?: string, listing_ids?: string[] }
): Promise<Comparison> => {
    
    const existingComparison = await prisma.comparison.findUnique({ where: { id: comparisonId } });

    if (!existingComparison) {
        throw new NotFoundError('Comparison not found.');
    }

    if (existingComparison.user_id !== userId) {
        throw new ForbiddenError('You can only update your own comparisons.');
    }

    if (updateData.listing_ids && updateData.listing_ids.length < 2) {
        throw new ValidationError('A comparison must have at least two listings.');
    }

    // Validate new listing IDs if they are provided
    if (updateData.listing_ids) {
        await getDetailedListings(updateData.listing_ids); 
    }

    const updatedComparison = await prisma.comparison.update({
        where: { id: comparisonId },
        data: updateData,
    });

    return updatedComparison;
};

/**
 * Deletes a comparison set.
 */
export const deleteComparison = async (comparisonId: string, userId: string): Promise<void> => {
    
    const existingComparison = await prisma.comparison.findUnique({ where: { id: comparisonId } });

    if (!existingComparison) {
        throw new NotFoundError('Comparison not found.');
    }

    if (existingComparison.user_id !== userId) {
        throw new ForbiddenError('You can only delete your own comparisons.');
    }

    await prisma.comparison.delete({ where: { id: comparisonId } });
};