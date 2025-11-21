import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as viewingService from '../services/viewing.service';
import { ValidationError } from '../utils/customErrors';

// POST /api/listings/:listingId/viewings - Schedule new viewing
export const scheduleViewing = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');

        const listingId = req.params.listingId;
        const { scheduled_date, scheduled_time, duration_minutes, location_notes } = req.body;

        if (!scheduled_date) {
            throw new ValidationError('scheduled_date is required.');
        }

        const newViewing = await viewingService.scheduleViewing(userId, listingId, {
            scheduled_date,
            scheduled_time,
            duration_minutes,
            location_notes,
        });

        res.status(201).json({ success: true, data: newViewing });
    } catch (error) {
        next(error);
    }
};

// GET /api/viewings - Get all Viewings for the Hunter
export const getHunterViewings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');

        const { attended, listing_id, sortBy } = req.query;

        const filter = {
            attended: attended !== undefined ? attended === 'true' : undefined,
            listing_id: listing_id as string | undefined,
        };

        const sortByValue = sortBy as 'date_asc' | 'date_desc' || 'date_asc';

        const viewings = await viewingService.getHunterViewings(userId, filter, sortByValue);

        res.status(200).json({ success: true, data: viewings });
    } catch (error) {
        next(error);
    }
};

// GET /api/viewings/upcoming - Quick endpoint for next N upcoming viewings
export const getUpcomingViewings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');
        
        const limit = parseInt(req.query.limit as string) || 5;

        const viewings = await viewingService.getUpcomingViewings(userId, limit);

        res.status(200).json({ success: true, data: viewings });
    } catch (error) {
        next(error);
    }
};

// PUT /api/viewings/:id - Update Viewing status/notes/rating
export const updateViewing = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');
        
        const viewingId = req.params.id;
        const { scheduled_date, scheduled_time, duration_minutes, location_notes, attended, viewing_notes, rating } = req.body;

        const updateData: any = {};
        if (scheduled_date !== undefined) updateData.scheduled_date = scheduled_date;
        if (scheduled_time !== undefined) updateData.scheduled_time = scheduled_time;
        if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
        if (location_notes !== undefined) updateData.location_notes = location_notes;
        if (attended !== undefined) updateData.attended = attended;
        if (viewing_notes !== undefined) updateData.viewing_notes = viewing_notes;
        if (rating !== undefined) updateData.rating = rating;


        if (Object.keys(updateData).length === 0) {
            throw new ValidationError('No valid fields provided for update.');
        }
        
        const updatedViewing = await viewingService.updateViewing(viewingId, userId, updateData);

        res.status(200).json({ success: true, data: updatedViewing });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/viewings/:id - Cancel/delete Viewing
export const deleteViewing = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');
        
        const viewingId = req.params.id;

        await viewingService.deleteViewing(viewingId, userId);

        res.status(200).json({ success: true, message: 'Viewing appointment cancelled successfully.' });
    } catch (error) {
        next(error);
    }
};