import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { findUserById } from '../services/auth.service';
import { AuthError } from '../utils/customErrors';

// Extend the Express Request interface to include the user object
export interface AuthenticatedRequest extends Request {}

/**
 * Middleware to verify JWT token from Authorization header or cookie.
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    // 1. Check for token in Authorization header (Bearer scheme)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } 
    
    // 2. Check for token in a cookie named 'jwt'
    if (!token && req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        // 401 Unauthorized: No token found
        return next(new AuthError('Not authorized, no token.'));
    }

    try {
        // Verify token
        const decoded = verifyToken(token);
        
        // Find user by ID from the token payload
        const user = await findUserById(decoded.id);

        if (!user) {
            return next(new AuthError('Not authorized, user not found.'));
        }

        // Attach user to the request object (excluding password hash)
        req.user = user;
        next();

    } catch (error) {
        console.error('Auth middleware error:', error);
        // 401 Unauthorized: Invalid or expired token
        next(error); 
    }
};

export const authenticateOptional = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        let token;

        // Optional token in header or cookie
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.jwt) {
            token = req.cookies.jwt;
        }

        if (token) {
            const decoded = verifyToken(token);
            const user = await findUserById(decoded.id);

            if (user) {
                req.user = user;
            }
        }

        // Always continue — even if no token or invalid token
        next();
    } catch {
        next(); // silently continue without user
    }
};