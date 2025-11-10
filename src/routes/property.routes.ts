import { Router } from 'express';
import { authenticateOptional, protect } from '../middleware/authMiddleware';
import { 
    createProperty, 
    browseAllProperties,
    listMyProperties,
    getProperty, 
    updateProperty,
    updatePropertyStatus,
    deleteProperty,
    addImagesToProperty,
    deleteImageFromProperty,
    reorderImages 
} from '../controllers/property.controller';
import { uploadImages } from '../middleware/uploadMiddleware';

const router = Router();

// Public/Optional Auth Routes (anyone can browse)
router.get('/browse', authenticateOptional, browseAllProperties);

// Protected Routes (require authentication)
router.post('/', protect, createProperty);// POST - Create new property
router.get('/my-properties', protect, listMyProperties); // GET - My properties only


router.route('/:id')
    .get(authenticateOptional, getProperty) // GET - Anyone can view any property
    .put(protect, updateProperty) // PUT - (owner only)
    .delete(protect, deleteProperty); // DELETE - (owner only)

router.patch('/:id/status', protect, updatePropertyStatus); // PATCH - (owner only)


// Image Upload Routes
router.post('/:id/images', protect, uploadImages, addImagesToProperty); // POST /api/properties/:id/images
router.delete('/:id/images', protect, deleteImageFromProperty); // DELETE /api/properties/:id/images
router.put('/:id/images/reorder', protect, reorderImages);// PUT /api/properties/:id/images/reorder


export default router;