import { Router } from 'express';
import authRoutes from './auth.routes';


const router = Router();

router.use('/auth', authRoutes);

// Property, Viewings, Comparison routes will be added here later

export default router;