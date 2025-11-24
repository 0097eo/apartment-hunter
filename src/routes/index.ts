import { Router } from 'express';
import authRoutes from './auth.routes';
import listingRoutes from './listing.routes';
import savedPropertyRoutes from './savedProperty.routes';
import viewingRoutes from './viewing.routes';
import comparisonRoutes from './comparison.routes';
import tagRoutes from './tag.routes';


const router = Router();

router.use('/auth', authRoutes);
router.use('/listings', listingRoutes);
router.use('/saved-properties', savedPropertyRoutes);
router.use('/viewings', viewingRoutes);
router.use('/comparisons', comparisonRoutes);
router.use('/tags', tagRoutes); 



export default router;