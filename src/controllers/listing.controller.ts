// src/controllers/listing.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as listingService from '../services/listing.service';
import { Listing, PropertyType } from '@prisma/client';
import { ValidationError } from '../utils/customErrors';

// Utility to validate property type
const isValidPropertyType = (value: any): value is PropertyType => {
    return Object.values(PropertyType).includes(value as PropertyType);
};

// POST /api/listings - Create new public listing
export const createListing = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');

        const imageFiles = (req.files as Express.Multer.File[]) || [];
        
        const { title, address, city, county, zip_code, price, bedrooms, bathrooms, square_feet, property_type } = req.body;

        if (!title || !price || !address || !city || !county || !bedrooms || !bathrooms || !property_type) {
            throw new ValidationError('Missing required listing fields.');
        }

        const parsedPrice = parseFloat(price);
        const parsedBedrooms = parseInt(bedrooms, 10);
        const parsedBathrooms = parseFloat(bathrooms);
        const parsedSquareFeet = square_feet ? parseInt(square_feet, 10) : undefined;
        
        if (isNaN(parsedPrice) || isNaN(parsedBedrooms) || isNaN(parsedBathrooms) || !isValidPropertyType(property_type)) {
            throw new ValidationError('Invalid data type for price, bedrooms, bathrooms, or property type.');
        }

        const listingData = {
            title,
            address,
            city,
            county,
            zip_code,
            price: parsedPrice,
            bedrooms: parsedBedrooms,
            bathrooms: parsedBathrooms,
            square_feet: parsedSquareFeet,
            property_type: property_type as PropertyType,
        };

        const newListing = await listingService.createListing(userId, listingData, imageFiles);
        
        res.status(201).json({ success: true, data: newListing });

    } catch (error) {
        next(error);
    }
};

// GET /api/listings/my - List all Public Listings posted by the authenticated user
export const getMyListings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const isActive = req.query.is_active === 'false' ? false : (req.query.is_active === 'true' ? true : undefined);

        const result = await listingService.getMyListings(userId, page, limit, isActive);

        res.status(200).json({ success: true, data: result.listings, pagination: {
            page: result.page,
            limit: result.limit,
            totalCount: result.totalCount,
            totalPages: result.totalPages,
        } });
    } catch (error) {
        next(error);
    }
};

// GET /api/listings/:id - Get single public listing details
export const getListingDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const listingId = req.params.id;

        const listing = await listingService.getListingById(listingId);

        res.status(200).json({ success: true, data: listing });
    } catch (error) {
        next(error);
    }
};

// PUT /api/listings/:id - Update public listing
export const updateListing = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');

        const listingId = req.params.id;
        const imageFiles = (req.files as Express.Multer.File[]) || [];
        const { existingImageUrls: existingUrlsJson, ...updateFields } = req.body;
        
        // Handle existingImageUrls from form-data (can be string or JSON array string)
        let existingImageUrls: string[] = [];
        if (existingUrlsJson) {
            try {
                // Attempt to parse as JSON array
                existingImageUrls = JSON.parse(existingUrlsJson);
            } catch {
                // If it's not JSON, assume a single URL string
                if (typeof existingUrlsJson === 'string') {
                    existingImageUrls = [existingUrlsJson];
                } else {
                    throw new ValidationError('Invalid format for existingImageUrls.');
                }
            }
        }
        
        // Basic type parsing for update
        const parsedUpdateData: Record<string, any> = {};
        for (const key in updateFields) {
            const value = updateFields[key];
            if (value !== undefined) {
                if (key === 'price' || key === 'bathrooms') parsedUpdateData[key] = parseFloat(value);
                else if (key === 'bedrooms' || key === 'square_feet') parsedUpdateData[key] = parseInt(value, 10);
                else if (key === 'property_type' && isValidPropertyType(value)) parsedUpdateData[key] = value as PropertyType;
                else if (key === 'is_active') parsedUpdateData[key] = value === 'true'; // Handle boolean from form-data
                else parsedUpdateData[key] = value;
            }
        }

        const updatedListing = await listingService.updateListing(
            listingId, 
            userId, 
            parsedUpdateData, 
            imageFiles, 
            existingImageUrls
        );

        res.status(200).json({ success: true, data: updatedListing });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/listings/:id - Delete public listing (Soft Delete)
export const deleteListing = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');
        
        const listingId = req.params.id;

        await listingService.deleteListing(listingId, userId);

        res.status(200).json({ success: true, message: 'Listing deactivated successfully.' });
    } catch (error) {
        next(error);
    }
};