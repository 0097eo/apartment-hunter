import { Router } from 'express';
import authRoutes from './auth.routes';
import listingRoutes from './listing.routes';
import savedPropertyRoutes from './savedProperty.routes';


const router = Router();

router.use('/auth', authRoutes);
router.use('/listings', listingRoutes);
router.use('/saved-properties', savedPropertyRoutes);

// Property, Viewings, Comparison routes will be added here later

export default router;