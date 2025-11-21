import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as comparisonService from '../services/comparison.service';
import { ValidationError } from '../utils/customErrors';

// POST /api/comparisons - Create a comparison set
export const createComparison = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');

        const { name, listing_ids } = req.body;

        if (!name || !listing_ids || !Array.isArray(listing_ids) || listing_ids.length < 2) {
            throw new ValidationError('Name and an array of at least two listing_ids are required.');
        }

        const comparison = await comparisonService.createComparison(userId, name, listing_ids);

        res.status(201).json({ success: true, data: comparison });
    } catch (error) {
        next(error);
    }
};

// GET /api/comparisons - List all saved comparisons for the Hunter
export const getHunterComparisons = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');

        const comparisons = await comparisonService.getHunterComparisons(userId);

        res.status(200).json({ success: true, data: comparisons });
    } catch (error) {
        next(error);
    }
};

// GET /api/comparisons/:id - Get detailed comparison
export const getDetailedComparison = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');
        
        const comparisonId = req.params.id;

        const comparison = await comparisonService.getDetailedComparison(comparisonId, userId);

        res.status(200).json({ success: true, data: comparison });
    } catch (error) {
        next(error);
    }
};

// PUT /api/comparisons/:id - Update comparison (name/listing_ids)
export const updateComparison = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');

        const comparisonId = req.params.id;
        const { name, listing_ids } = req.body;

        const updateData: { name?: string, listing_ids?: string[] } = {};
        if (name !== undefined) updateData.name = name;
        if (listing_ids !== undefined && Array.isArray(listing_ids)) updateData.listing_ids = listing_ids;

        if (Object.keys(updateData).length === 0) {
            throw new ValidationError('No valid fields provided for update.');
        }

        const updatedComparison = await comparisonService.updateComparison(comparisonId, userId, updateData);

        res.status(200).json({ success: true, data: updatedComparison });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/comparisons/:id - Delete comparison
export const deleteComparison = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');
        
        const comparisonId = req.params.id;

        await comparisonService.deleteComparison(comparisonId, userId);

        res.status(200).json({ success: true, message: 'Comparison deleted successfully.' });
    } catch (error) {
        next(error);
    }
};