import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    createTag,
    getHunterTags,
    updateTag,
    deleteTag,
} from '../controllers/tag.controller';

const router = Router();

// Tag CRUD (User-specific)
router.use(protect);

router.route('/')
    .post(createTag)    // POST /api/tags
    .get(getHunterTags); // GET /api/tags

router.route('/:id')
    .put(updateTag)     // PUT /api/tags/:id
    .delete(deleteTag); // DELETE /api/tags/:id

export default router;