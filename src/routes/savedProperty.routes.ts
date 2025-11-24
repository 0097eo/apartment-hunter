// src/routes/savedProperty.routes.ts
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    saveListingToHunterList,
    getHunterSavedProperties,
    getSingleSavedProperty,
    updateHunterSavedProperty,
    deleteHunterSavedProperty,
} from '../controllers/savedProperty.controller';
import {
    addTagToProperty,
    removeTagFromProperty,
} from '../controllers/tag.controller';

const router = Router();

// All routes require authentication
router.use(protect);

router.route('/')
    .post(saveListingToHunterList)    // POST /api/saved-properties
    .get(getHunterSavedProperties);  // GET /api/saved-properties

router.route('/:id')
    .get(getSingleSavedProperty)      // GET /api/saved-properties/:id
    .put(updateHunterSavedProperty)   // PUT /api/saved-properties/:id
    .delete(deleteHunterSavedProperty); // DELETE /api/saved-properties/:id

// --- Tagging Routes ---
router.post('/:savedPropertyId/tags', addTagToProperty); // POST /api/saved-properties/:savedPropertyId/tags
router.delete('/:savedPropertyId/tags/:tagId', removeTagFromProperty); // DELETE /api/saved-properties/:savedPropertyId/tags/:tagId

export default router;