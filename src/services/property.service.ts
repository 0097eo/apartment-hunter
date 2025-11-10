import prisma from "./prisma";
import { Property, PropertyStatus, PropertyType, Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError, ValidationError, AuthError } from '../utils/customErrors';
import { PropertyFilter, Pagination } from '../types/property';
import { getPublicIdFromUrl, deleteImageFromCloudinary } from '../utils/imageUpload';
import { uploadImageToCloudinary } from "../utils/imageUpload";
import { UploadResult } from "../utils/imageUpload";

const calculatePagination = (total: number, limit: number, page: number): Pagination => {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages: totalPages === 0 ? 1 : totalPages, // Always at least 1 page
    };
};

/**
 * Uploads new images to Cloudinary and updates property image_urls.
 */
export const addPropertyImages = async (
    propertyId: string, 
    userId: string, 
    files: Express.Multer.File[]
): Promise<Property> => {
    const property = await verifyPropertyOwnership(propertyId, userId);
    const newImageUrls: string[] = [...property.image_urls];
    
    // Check if max limit (e.g., 50 total) is reached (Optional, but good practice)
    if (newImageUrls.length + files.length > 50) {
        throw new ForbiddenError('Maximum image limit (50) reached for this property.');
    }

    const uploadResults: UploadResult[] = [];
    const publicIdsToCleanUp: string[] = [];
    
    try {
        // 1. Upload all files to Cloudinary sequentially
        for (const file of files) {
            // Upload to a unique folder path: apartment-hunter/properties/{propertyId}/
            const result = await uploadImageToCloudinary(file.buffer, propertyId);
            uploadResults.push(result);
            publicIdsToCleanUp.push(result.public_id);
        }
        
        // 2. Update the database with the new URLs
        const urlsToSave = uploadResults.map(r => r.secure_url);
        newImageUrls.push(...urlsToSave);

        const updatedProperty = await prisma.property.update({
            where: { id: propertyId },
            data: { image_urls: newImageUrls },
        });

        console.log(`Successfully uploaded and saved ${files.length} images for property ${propertyId}.`);
        return updatedProperty;

    } catch (dbOrCloudinaryError) {
        // CRITICAL: Rollback - delete all successfully uploaded images if the DB update fails
        console.error('Image upload/DB update failed. Initiating Cloudinary cleanup.', dbOrCloudinaryError);
        for (const publicId of publicIdsToCleanUp) {
            // Do not wait for deletion here, fire and forget to prevent blocking the error response
            deleteImageFromCloudinary(publicId).catch(err => {
                console.error(`Failed to clean up Cloudinary image ${publicId}:`, err);
            });
        }
        throw dbOrCloudinaryError;
    }
};

/**
 * Deletes a specific image URL from the property and from Cloudinary.
 */
export const deletePropertyImage = async (
    propertyId: string, 
    userId: string, 
    imageUrl: string
): Promise<Property> => {
    const property = await verifyPropertyOwnership(propertyId, userId);

    const publicId = getPublicIdFromUrl(imageUrl);
    if (!publicId) {
        throw new NotFoundError('Invalid or unparsable image URL for deletion.');
    }

    // 1. Delete from Cloudinary
    await deleteImageFromCloudinary(publicId);

    // 2. Remove URL from database array
    const newImageUrls = property.image_urls.filter(url => url !== imageUrl);

    const updatedProperty = await prisma.property.update({
        where: { id: propertyId },
        data: { image_urls: newImageUrls },
    });

    console.log(`Successfully deleted image ${publicId} from property ${propertyId}.`);
    return updatedProperty;
};

/**
 * Reorders the image URLs array for a property.
 */
export const reorderPropertyImages = async (
    propertyId: string, 
    userId: string, 
    imageUrls: string[]
): Promise<Property> => {
    const property = await verifyPropertyOwnership(propertyId, userId);
    
    // Basic validation: ensure the new array contains the same number of URLs
    if (property.image_urls.length !== imageUrls.length) {
        throw new ValidationError('The new image array must contain all existing image URLs for reordering.');
    }
    
    // Optional: More rigorous validation to ensure all IDs match
    const existingUrlSet = new Set(property.image_urls);
    if (!imageUrls.every(url => existingUrlSet.has(url))) {
        throw new ValidationError('One or more URLs in the new order are not valid existing property images.');
    }

    const updatedProperty = await prisma.property.update({
        where: { id: propertyId },
        data: { image_urls: imageUrls },
    });
    
    return updatedProperty;
};

/**
 * Creates a new property.
 */
export const createProperty = async (data: Prisma.PropertyCreateInput, userId: string): Promise<Property> => {
    console.log(`Creating property for user ${userId} with title: ${data.title}`);
    const property = await prisma.property.create({
        data: {
            ...data,
            user: { connect: { id: userId } },
            // Ensure array fields are initialized if not provided
            image_urls: data.image_urls || [],
            pros: data.pros || [],
            cons: data.cons || [],
        },
    });
    return property;
};

/**
 * Builds the WHERE clause for property filtering based on query parameters.
 */
const buildWhereClause = (filter: PropertyFilter, userId?: string): Prisma.PropertyWhereInput => {
    const where: Prisma.PropertyWhereInput = {};

    // Only filter by user_id if explicitly filtering for user's properties
    if (userId) {
        where.user_id = userId;
    }

    if (filter.status) {
        where.status = filter.status;
    }

    if (filter.city) {
        where.city = { contains: filter.city, mode: 'insensitive' };
    }

    if (filter.county) {
        where.county = filter.county;
    }

    if (filter.property_type && filter.property_type.length > 0) {
        where.property_type = { in: filter.property_type };
    }

    // Price filtering
    if (filter.min_price || filter.max_price) {
        where.price = {
            gte: filter.min_price,
            lte: filter.max_price,
        };
    }

    // Bedrooms filtering (Use bedrooms as a min_bedrooms filter if not min_bedrooms is provided)
    const minBedrooms = filter.min_bedrooms || filter.bedrooms;
    if (minBedrooms !== undefined) {
        where.bedrooms = { gte: minBedrooms };
    }

    // Bathrooms filtering
    if (filter.min_bathrooms !== undefined) {
        where.bathrooms = { gte: filter.min_bathrooms };
    }

    return where;
};

/**
 * Browse ALL properties (marketplace/search) - for apartment hunting.
 * This is the main discovery endpoint where users browse all available listings.
 */
export const browseAllProperties = async (filter: PropertyFilter): Promise<{ properties: Property[], pagination: Pagination }> => {
    const limit = filter.limit && filter.limit > 0 ? filter.limit : 20;
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const skip = (page - 1) * limit;

    // Do NOT pass userId - we want all properties
    const where = buildWhereClause(filter);

    // Sorting logic
    let orderBy: Prisma.PropertyOrderByWithRelationInput = {};
    switch (filter.sort) {
        case 'price_asc':
            orderBy = { price: 'asc' };
            break;
        case 'price_desc':
            orderBy = { price: 'desc' };
            break;
        case 'newest':
            orderBy = { created_at: 'desc' };
            break;
        case 'oldest':
            orderBy = { created_at: 'asc' };
            break;
        case 'bedrooms_desc':
            orderBy = { bedrooms: 'desc' };
            break;
        default:
            orderBy = { created_at: 'desc' }; // Default sort
    }

    // 1. Get total count
    const total = await prisma.property.count({ where });

    // 2. Get paginated results
    const properties = await prisma.property.findMany({
        where,
        orderBy,
        skip,
        take: limit,
    });

    return {
        properties,
        pagination: calculatePagination(total, limit, page),
    };
};

/**
 * List MY properties only - for property management dashboard.
 * This shows only properties owned by the authenticated user.
 */
export const listMyProperties = async (userId: string, filter: PropertyFilter): Promise<{ properties: Property[], pagination: Pagination }> => {
    const limit = filter.limit && filter.limit > 0 ? filter.limit : 20;
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const skip = (page - 1) * limit;

    // Pass userId to filter only user's properties
    const where = buildWhereClause(filter, userId);

    // Sorting logic
    let orderBy: Prisma.PropertyOrderByWithRelationInput = {};
    switch (filter.sort) {
        case 'price_asc':
            orderBy = { price: 'asc' };
            break;
        case 'price_desc':
            orderBy = { price: 'desc' };
            break;
        case 'newest':
            orderBy = { created_at: 'desc' };
            break;
        case 'oldest':
            orderBy = { created_at: 'asc' };
            break;
        case 'bedrooms_desc':
            orderBy = { bedrooms: 'desc' };
            break;
        default:
            orderBy = { created_at: 'desc' }; // Default sort
    }

    // 1. Get total count
    const total = await prisma.property.count({ where });

    // 2. Get paginated results
    const properties = await prisma.property.findMany({
        where,
        orderBy,
        skip,
        take: limit,
    });

    return {
        properties,
        pagination: calculatePagination(total, limit, page),
    };
};

/**
 * Gets a single property by ID. No ownership check - any user can view any property.
 */
export const getPropertyById = async (id: string): Promise<Property & { viewings: any[] }> => {
    const property = await prisma.property.findUnique({
        where: { id },
        include: {
            // Include associated viewing appointments
            viewings: {
                orderBy: {
                    scheduled_date: 'asc',
                },
                // Select specific fields to keep the property response clean
                select: {
                    id: true,
                    scheduled_date: true,
                    scheduled_time: true,
                    duration_minutes: true,
                    location_notes: true,
                    attended: true,
                    rating: true,
                },
            },
        },
    });

    if (!property) {
        throw new NotFoundError(`Property with ID ${id} not found.`);
    }

    // No ownership check - anyone can view
    return property as Property & { viewings: any[] }; 
};


/**
 * Updates an existing property. Only the owner can update.
 */
export const updateProperty = async (id: string, userId: string, data: Prisma.PropertyUpdateInput): Promise<Property> => {
    await verifyPropertyOwnership(id, userId);

    // Prevent modification of ID, user_id, created_at, etc.
    const cleanData = { ...data };
    delete (cleanData as any).id; 

    const updatedProperty = await prisma.property.update({
        where: { id },
        data: cleanData,
    });
    return updatedProperty;
};

/**
 * Updates only the status of a property. Only the owner can update.
 */
export const updatePropertyStatus = async (id: string, userId: string, status: PropertyStatus): Promise<Property> => {
    await verifyPropertyOwnership(id, userId);

    const updatedProperty = await prisma.property.update({
        where: { id },
        data: { status },
    });
    return updatedProperty;
};

/**
 * Deletes a property and its associated Cloudinary images. Only the owner can delete.
 */
export const deleteProperty = async (id: string, userId: string): Promise<void> => {
    const property = await verifyPropertyOwnership(id, userId);

    // 1. Delete associated Cloudinary images
    for (const url of property.image_urls) {
        const publicId = getPublicIdFromUrl(url);
        if (publicId) {
            await deleteImageFromCloudinary(publicId);
        } else {
            console.warn(`Could not extract public ID from URL: ${url}. Skipping Cloudinary delete.`);
        }
    }

    // 2. Delete property (Viewings are cascade deleted due to schema: onDelete: Cascade)
    await prisma.property.delete({
        where: { id },
    });

    console.log(`Property ${id} deleted by user ${userId}.`);
};

/**
 * Internal helper to check ownership and return the property.
 * Throws NotFoundError or ForbiddenError.
 */
const verifyPropertyOwnership = async (id: string, userId: string): Promise<Property> => {
    const property = await prisma.property.findUnique({ where: { id } });

    if (!property) {
        throw new NotFoundError(`Property with ID ${id} not found.`);
    }

    if (property.user_id !== userId) {
        throw new ForbiddenError('You do not have permission to modify this property.');
    }
    return property;
};