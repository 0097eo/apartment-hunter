import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as savedPropertyService from '../services/savedProperty.service';
import { ValidationError } from '../utils/customErrors';
import { PropertyStatus } from '@prisma/client';

const isValidStatus = (value: any): value is PropertyStatus => {
    return Object.values(PropertyStatus).includes(value as PropertyStatus);
};


export const saveListingToHunterList = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) throw new ValidationError('Authentication required.');

        const { listingId } = req.body;
        if (!listingId) throw new ValidationError('listingId is required.');

        const savedProperty = await savedPropertyService.saveListing(req.user.id, listingId);
        
        res.status(201).json({ success: true, data: savedProperty });

    } catch (error) {
        next(error);
    }
};

export const getHunterSavedProperties = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) throw new ValidationError('Authentication required.');

        const { status, city, county, minPrice, maxPrice, bedrooms, page, limit, sortBy } = req.query;

        const filter = {
            status: status && isValidStatus(status as string) ? status as PropertyStatus : undefined,
            city: city ? city as string : undefined,
            county: county ? county as string : undefined,
            minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
            bedrooms: bedrooms ? parseInt(bedrooms as string, 10) : undefined,
        };

        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;
        const sortByValue = sortBy as 'price_asc' | 'price_desc' | 'newest' || 'newest';

        const result = await savedPropertyService.getSavedProperties(req.user.id, filter, pageNum, limitNum, sortByValue);

        res.status(200).json({ 
            success: true, 
            data: result.savedProperties, 
            pagination: {
                page: result.page,
                limit: result.limit,
                totalCount: result.totalCount,
                totalPages: result.totalPages,
            }
        });

    } catch (error) {
        next(error);
    }
};

export const getSingleSavedProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) throw new ValidationError('Authentication required.');
        const savedPropertyId = req.params.id;
        
        const savedProperty = await savedPropertyService.getSavedPropertyById(savedPropertyId, req.user.id);

        res.status(200).json({ success: true, data: savedProperty });
    } catch (error) {
        next(error);
    }
};

export const updateHunterSavedProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) throw new ValidationError('Authentication required.');
        const savedPropertyId = req.params.id;
        const { notes, pros, cons, status } = req.body;

        const updateData: { notes?: string, pros?: string[], cons?: string[], status?: PropertyStatus } = {};
        if (notes !== undefined) updateData.notes = notes;
        // Ensure pros/cons are arrays before assignment
        if (pros !== undefined && Array.isArray(pros)) updateData.pros = pros;
        if (cons !== undefined && Array.isArray(cons)) updateData.cons = cons;
        if (status && isValidStatus(status)) updateData.status = status as PropertyStatus;

        if (Object.keys(updateData).length === 0) {
            throw new ValidationError('No valid fields provided for update.');
        }

        const updatedSavedProperty = await savedPropertyService.updateSavedProperty(savedPropertyId, req.user.id, updateData);

        res.status(200).json({ success: true, data: updatedSavedProperty });
    } catch (error) {
        next(error);
    }
};

export const deleteHunterSavedProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) throw new ValidationError('Authentication required.');
        const savedPropertyId = req.params.id;

        await savedPropertyService.deleteSavedProperty(savedPropertyId, req.user.id);

        res.status(200).json({ success: true, message: 'Property removed from saved list.' });
    } catch (error) {
        next(error);
    }
};