import { Router } from 'express';
import { protect, authenticateOptional } from '../middleware/authMiddleware';
import { uploadImages } from '../middleware/uploadMiddleware';
import {
    createListing,
    getMyListings,
    getListingDetails,
    updateListing,
    deleteListing,
    getPublicListings,
} from '../controllers/listing.controller';

const router = Router();

// Global Public Listing Search
router.route('/public')
    .get(authenticateOptional, getPublicListings);

// Routes for Lister/Agent features
router.route('/')
    .post(protect, uploadImages, createListing); // POST /api/listings (Requires JWT and multi-part form data)

router.route('/my')
    .get(protect, getMyListings); // GET /api/listings/my

router.route('/:id')
    .get(authenticateOptional, getListingDetails) // GET /api/listings/:id (Publicly accessible, optional auth for ownership checks)
    .put(protect, uploadImages, updateListing) // PUT /api/listings/:id (Requires JWT, must be owner, supports multi-part form)
    .delete(protect, deleteListing); // DELETE /api/listings/:id (Soft Delete)

export default router;