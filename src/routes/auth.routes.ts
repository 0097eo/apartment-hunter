import { Router } from 'express';
import passport from 'passport';
import { 
    register, 
    login, 
    getMe, 
    logout, 
    googleAuthCallback 
} from '../controllers/auth.controller';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// --- Local Auth ---
router.post('/register', register);
router.post('/login', login);

// --- Google Auth ---
// Initiate Google OAuth
router.get(
    '/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'] 
    })
);

// Handle Google callback and redirect
router.get(
    '/google/callback', 
    passport.authenticate('google', { 
        session: false, // Do not create a session
        failureRedirect: `${process.env.FRONTEND_URL}/auth-error`, 
    }), 
    googleAuthCallback
);

// --- Shared ---
router.get('/me', protect, getMe);
router.post('/logout', logout);

export default router;