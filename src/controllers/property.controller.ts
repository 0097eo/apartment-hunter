import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as propertyService from '../services/property.service';
import { PropertyStatus, PropertyType, Prisma } from '@prisma/client';
import { ValidationError } from '../utils/customErrors';
import { PropertyFilter } from '../types/property';


// Utility to parse array/enum query params
const parseArrayParam = (param: string | string[] | undefined): string[] => {
    if (Array.isArray(param)) return param.map(String);
    if (typeof param === 'string') return param.split(',').map(s => s.trim()).filter(s => s.length > 0);
    return [];
};

const parsePropertyTypeArray = (param: string | string[] | undefined): PropertyType[] => {
    const types = parseArrayParam(param).map(s => s.toUpperCase()) as PropertyType[];
    // Simple validation against enum values
    const validTypes = Object.values(PropertyType);
    return types.filter(type => validTypes.includes(type));
};

// Helper function to build filter from query params (DRY)
const buildFilterFromQuery = (query: any): PropertyFilter => {
    return {
        status: query.status ? (query.status as PropertyStatus) : undefined,
        city: query.city ? (query.city as string) : undefined,
        county: query.county ? (query.county as string) : undefined,
        min_price: query.min_price ? parseFloat(query.min_price as string) : undefined,
        max_price: query.max_price ? parseFloat(query.max_price as string) : undefined,
        bedrooms: query.bedrooms ? parseInt(query.bedrooms as string, 10) : undefined,
        min_bathrooms: query.min_bathrooms ? parseFloat(query.min_bathrooms as string) : undefined,
        property_type: parsePropertyTypeArray(query.property_type as string),
        page: query.page ? parseInt(query.page as string, 10) : 1,
        limit: query.limit ? parseInt(query.limit as string, 10) : 20,
        sort: query.sort as string,
    };
};

export const createProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const data = req.body;

        // Minimal validation (Full validation in Prompt 13)
        if (!data.title || !data.address || !data.city || !data.county || !data.price || !data.property_type) {
            throw new ValidationError('Missing required fields: title, address, city, county, price, property_type.');
        }

        // Convert price to Decimal
        const priceDecimal = new Prisma.Decimal(data.price);
        
        const propertyData: Prisma.PropertyCreateInput = {
            ...data,
            price: priceDecimal,
            bedrooms: parseInt(data.bedrooms, 10) || 0,
            bathrooms: parseFloat(data.bathrooms) || 0,
            square_feet: data.square_feet ? parseInt(data.square_feet, 10) : undefined,
            user: { connect: { id: userId } },
        };

        const newProperty = await propertyService.createProperty(propertyData, userId);
        res.status(201).json({ success: true, data: newProperty });
    } catch (error) {
        next(error);
    }
};

/**
 * Browse ALL properties - Marketplace/search endpoint for apartment hunting
 * Any user (authenticated or not) can browse all properties
 */
export const browseAllProperties = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const filter = buildFilterFromQuery(req.query);

        const { properties, pagination } = await propertyService.browseAllProperties(filter);

        res.status(200).json({ 
            success: true, 
            data: properties, 
            pagination 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * List MY properties only - Personal property management dashboard
 * Only shows properties owned by the authenticated user
 */
export const listMyProperties = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const filter = buildFilterFromQuery(req.query);

        const { properties, pagination } = await propertyService.listMyProperties(userId, filter);

        res.status(200).json({ 
            success: true, 
            data: properties, 
            pagination 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single property by ID - Anyone can view any property
 */
export const getProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const property = await propertyService.getPropertyById(id);
        res.status(200).json({ success: true, data: property });
    } catch (error) {
        next(error);
    }
};

export const updateProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;
        const data = req.body;

        // Convert price to Decimal if present
        if (data.price) {
             data.price = new Prisma.Decimal(data.price);
        }

        const updatedProperty = await propertyService.updateProperty(id, userId, data);
        res.status(200).json({ success: true, data: updatedProperty });
    } catch (error) {
        next(error);
    }
};

export const updatePropertyStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;
        const { status } = req.body;

        if (!status || !Object.values(PropertyStatus).includes(status)) {
            throw new ValidationError('Invalid or missing property status.', [{ field: 'status', message: 'Status must be one of: saved, interested, viewed, applied, rejected.' }]);
        }

        const updatedProperty = await propertyService.updatePropertyStatus(id, userId, status);
        res.status(200).json({ success: true, data: updatedProperty });
    } catch (error) {
        next(error);
    }
};

export const deleteProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        await propertyService.deleteProperty(id, userId);
        res.status(200).json({ success: true, message: 'Property and associated images successfully deleted.' });
    } catch (error) {
        next(error);
    }
};

export const addImagesToProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;
        
        // Multer attaches files to req.files
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            throw new ValidationError('No files uploaded. Please include at least one image file under the "images" field.');
        }

        const updatedProperty = await propertyService.addPropertyImages(id, userId, files);
        res.status(200).json({ success: true, data: updatedProperty });
    } catch (error) {
        // Multer errors (like file size/count) are handled by the errorMiddleware if they throw a ValidationError
        next(error);
    }
};

export const deleteImageFromProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;
        const { imageUrl } = req.body;

        if (!imageUrl) {
            throw new ValidationError('Missing required field: imageUrl.');
        }

        const updatedProperty = await propertyService.deletePropertyImage(id, userId, imageUrl);
        res.status(200).json({ success: true, data: updatedProperty });
    } catch (error) {
        next(error);
    }
};

export const reorderImages = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;
        const { imageUrls } = req.body;

        if (!Array.isArray(imageUrls)) {
            throw new ValidationError('Invalid input. imageUrls must be an array.', [{ field: 'imageUrls', message: 'Must be an array of image URLs.' }]);
        }

        const updatedProperty = await propertyService.reorderPropertyImages(id, userId, imageUrls);
        res.status(200).json({ success: true, data: updatedProperty });
    } catch (error) {
        next(error);
    }
};