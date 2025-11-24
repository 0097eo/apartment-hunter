import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as dashboardService from '../services/dashboard.service';
import { ValidationError } from '../utils/customErrors';

// GET /api/dashboard/stats - Return user's summary statistics
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');

        const stats = await dashboardService.getDashboardStats(userId);

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};