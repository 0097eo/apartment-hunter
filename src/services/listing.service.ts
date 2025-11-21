import prisma from '../utils/prisma';
import { Listing, Prisma, PropertyType } from '@prisma/client';
import { uploadImageToCloudinary, deleteImageFromCloudinary, getPublicIdFromUrl } from '../utils/imageUpload';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/customErrors';

type SafeListing = Omit<Listing, 'image_urls'> & { image_urls: string[] };

/**
 * Creates a new Listing, handling Cloudinary uploads for images.
 */
export const createListing = async (
    userId: string, 
    listingData: Omit<Prisma.ListingCreateInput, 'lister' | 'image_urls' | 'user_id'>,
    imageFiles: Express.Multer.File[]
): Promise<SafeListing> => {
    
    if (imageFiles.length === 0) {
        throw new ValidationError('At least one image is required for a new listing.');
    }


    const newListing = await prisma.listing.create({
        data: {
            ...listingData,
            user_id: userId,
            image_urls: [], // Placeholder
        },
    });

    try {
        const uploadResults = await Promise.all(
            imageFiles.map(file => 
                uploadImageToCloudinary(file.buffer, newListing.id)
            )
        );

        const newImageUrls = uploadResults.map(res => res.secure_url);

        const updatedListing = await prisma.listing.update({
            where: { id: newListing.id },
            data: { image_urls: newImageUrls },
        });

        return updatedListing as SafeListing;

    } catch (error) {
        // If upload fails, delete the created listing to prevent orphaned records
        await prisma.listing.delete({ where: { id: newListing.id } }).catch(err => {
            console.error(`Failed to delete orphaned listing ${newListing.id}:`, err);
        });
        throw error;
    }
};

/**
 * Finds a single Listing by ID, including upcoming viewings.
 */
export const getListingById = async (listingId: string) => {
    const listing = await prisma.listing.findUnique({
        where: { id: listingId, is_active: true },
        include: {
            lister: {
                select: { id: true, name: true, email: true, profile_picture: true }
            },
            viewings: {
                where: { scheduled_date: { gte: new Date() } },
                orderBy: { scheduled_date: 'asc' },
                take: 5,
                select: {
                    id: true,
                    scheduled_date: true,
                    scheduled_time: true,
                    location_notes: true,
                    duration_minutes: true,
                    hunter: {
                        select: { id: true, name: true, email: true }
                    }
                }
            }
        },
    });

    if (!listing) {
        throw new NotFoundError('Listing not found or is inactive.');
    }

    return listing;
};

/**
 * Gets all Listings posted by a specific Lister/Agent.
 */
export const getMyListings = async (userId: string, page: number = 1, limit: number = 10, isActive: boolean | undefined) => {
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
        user_id: userId,
        ...(isActive !== undefined && { is_active: isActive })
    };

    const [listings, totalCount] = await prisma.$transaction([
        prisma.listing.findMany({
            where: where,
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
        }),
        prisma.listing.count({ where: where }),
    ]);

    return {
        listings: listings as SafeListing[],
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
    };
};

/**
 * Updates a listing, including handling image changes.
 */
export const updateListing = async (
    listingId: string, 
    userId: string, 
    updateData: Partial<Omit<Prisma.ListingUpdateInput, 'image_urls' | 'user_id'>>,
    files: Express.Multer.File[],
    existingImageUrls: string[] = [] // URLs to keep from the existing set
): Promise<SafeListing> => {
    

    const existingListing = await prisma.listing.findUnique({
        where: { id: listingId },
    });

    if (!existingListing) {
        throw new NotFoundError('Listing not found.');
    }

    if (existingListing.user_id !== userId) {
        throw new ForbiddenError('You can only update listings you have posted.');
    }

    const currentImageUrls = existingListing.image_urls;
    const newImageUrls: string[] = [...existingImageUrls]; 
    
    const imagesToDelete = currentImageUrls.filter(url => !existingImageUrls.includes(url));
    const deletePublicIds = imagesToDelete
        .map(getPublicIdFromUrl)
        .filter((id): id is string => id !== null);


    if (files.length > 0) {
        const uploadResults = await Promise.all(
            files.map(file => uploadImageToCloudinary(file.buffer, listingId))
        );
        newImageUrls.push(...uploadResults.map(res => res.secure_url));
    }

    if (deletePublicIds.length > 0) {
        await Promise.all(
            deletePublicIds.map(id => 
                deleteImageFromCloudinary(id).catch(err => {
                    console.warn(`Soft error deleting Cloudinary image ${id}: ${err.message}`);
                })
            )
        );
    }

    const updatedListing = await prisma.listing.update({
        where: { id: listingId },
        data: {
            ...updateData,
            image_urls: newImageUrls,
            updated_at: new Date(),
        },
    });

    return updatedListing as SafeListing;
};


/**
 * Deletes a listing (implements soft delete by setting is_active: false).
 */
export const deleteListing = async (listingId: string, userId: string): Promise<void> => {
    
    const existingListing = await prisma.listing.findUnique({
        where: { id: listingId },
    });

    if (!existingListing) {
        throw new NotFoundError('Listing not found.');
    }

    if (existingListing.user_id !== userId) {
        throw new ForbiddenError('You can only delete listings you have posted.');
    }

    // Soft delete: Update is_active to false
    await prisma.listing.update({
        where: { id: listingId },
        data: { is_active: false },
    });
    
};

/**
 * Global Search and Filter for all Active Listings.
 * Includes 'is_saved' status if a userId is provided.
 */
export const searchPublicListings = async (
    filter: { 
        city?: string, 
        county?: string, 
        minPrice?: number, 
        maxPrice?: number, 
        bedrooms?: number, 
        property_type?: PropertyType 
    },
    userId: string | undefined, // Optional for unauthenticated users
    page: number = 1, 
    limit: number = 20,
    sortBy: 'price_asc' | 'price_desc' | 'newest' = 'newest'
): Promise<{ 
    listings: (Listing & { is_saved: boolean })[], 
    totalCount: number, 
    page: number, 
    limit: number, 
    totalPages: number 
}> => {
    const skip = (page - 1) * limit;

    // Build the WHERE clause for filtering
    const where: Prisma.ListingWhereInput = {
        is_active: true, // Only search active listings
        ...(filter.city && { city: { equals: filter.city, mode: 'insensitive' } }),
        ...(filter.county && { county: { equals: filter.county, mode: 'insensitive' } }),
        ...(filter.bedrooms && { bedrooms: filter.bedrooms }),
        ...(filter.property_type && { property_type: filter.property_type }),
        ...(filter.minPrice || filter.maxPrice ? {
            price: {
                ...(filter.minPrice && { gte: new Prisma.Decimal(filter.minPrice) }),
                ...(filter.maxPrice && { lte: new Prisma.Decimal(filter.maxPrice) }),
            }
        } : {})
    };

    // Determine the ORDER BY clause
    let orderBy: Prisma.ListingOrderByWithRelationInput;
    switch (sortBy) {
        case 'price_asc':
            orderBy = { price: 'asc' };
            break;
        case 'price_desc':
            orderBy = { price: 'desc' };
            break;
        case 'newest':
        default:
            orderBy = { created_at: 'desc' };
            break;
    }

    // Fetch listings and total count
    const [listings, totalCount] = await prisma.$transaction([
        prisma.listing.findMany({
            where,
            orderBy,
            skip,
            take: limit,
        }),
        prisma.listing.count({ where }),
    ]);

    let savedListingIds: Set<string> = new Set();
    
    // If user is authenticated, find their saved listing IDs for the current batch
    if (userId && listings.length > 0) {
        const listingIds = listings.map(l => l.id);
        const savedProperties = await prisma.savedProperty.findMany({
            where: {
                user_id: userId,
                listing_id: { in: listingIds },
            },
            select: { listing_id: true }
        });
        // Create a quick lookup Set for O(1) checking
        savedListingIds = new Set(savedProperties.map(sp => sp.listing_id));
    }

    // Map results to include the is_saved flag
    const mappedListings = listings.map(listing => ({
        ...listing,
        is_saved: savedListingIds.has(listing.id),
    })) as (Listing & { is_saved: boolean })[];

    return {
        listings: mappedListings,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
    };
};