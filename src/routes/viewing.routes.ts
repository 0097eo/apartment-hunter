import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    scheduleViewing,
    getHunterViewings,
    getUpcomingViewings,
    updateViewing,
    deleteViewing,
} from '../controllers/viewing.controller';

const router = Router();

// Routes for scheduling a viewing on a specific listing
router.post('/listings/:listingId/viewings', protect, scheduleViewing); // POST /api/viewings/listings/:listingId/viewings

// Routes for managing the Hunter's own viewings
router.use(protect); 

router.route('/')
    .get(getHunterViewings); // GET /api/viewings

router.route('/upcoming')
    .get(getUpcomingViewings); // GET /api/viewings/upcoming

router.route('/:id')
    .put(updateViewing)
    .delete(deleteViewing);

export default router;