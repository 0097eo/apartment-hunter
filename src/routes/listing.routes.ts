// src/routes/listing.routes.ts
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { uploadImages } from '../middleware/uploadMiddleware';
import {
    createListing,
    getMyListings,
    getListingDetails,
    updateListing,
    deleteListing,
} from '../controllers/listing.controller';

const router = Router();

// Routes for Lister/Agent features
router.route('/')
    .post(protect, uploadImages, createListing); // POST /api/listings (Requires JWT and multi-part form data)

router.route('/my')
    .get(protect, getMyListings); // GET /api/listings/my

router.route('/:id')
    .get(getListingDetails) // GET /api/listings/:id (Publicly accessible)
    .put(protect, uploadImages, updateListing) // PUT /api/listings/:id (Requires JWT, must be owner, supports multi-part form)
    .delete(protect, deleteListing); // DELETE /api/listings/:id (Soft Delete)

export default router;