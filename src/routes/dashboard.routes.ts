import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { getDashboardStats } from '../controllers/dashboard.controller';

const router = Router();

router.route('/stats')
    .get(protect, getDashboardStats); // GET /api/dashboard/stats

export default router;