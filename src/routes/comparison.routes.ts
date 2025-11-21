import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    createComparison,
    getHunterComparisons,
    getDetailedComparison,
    updateComparison,
    deleteComparison,
} from '../controllers/comparison.controller';

const router = Router();

router.use(protect);

router.route('/')
    .post(createComparison)    // POST /api/comparisons
    .get(getHunterComparisons); // GET /api/comparisons

router.route('/:id')
    .get(getDetailedComparison)  // GET /api/comparisons/:id
    .put(updateComparison)       // PUT /api/comparisons/:id
    .delete(deleteComparison);   // DELETE /api/comparisons/:id

export default router;