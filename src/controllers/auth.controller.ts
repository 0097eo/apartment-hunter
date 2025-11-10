import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { generateToken } from '../utils/jwt';
import { AuthError, ValidationError } from '../utils/customErrors';

const JWT_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};

/**
 * Sends a JWT token in a cookie and returns a sanitized user object.
 */
const sendTokenResponse = (res: Response, user: any) => {
    const token = generateToken(user);

    
    // Set cookie
    res.cookie('jwt', token, JWT_COOKIE_OPTIONS);

    // Return response
    const { password_hash, ...safeUser } = user;
    res.status(200).json({
        success: true,
        data: safeUser,
        token, // Optionally return token in body for non-browser/mobile clients
    });
};

// --- Local Auth ---

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || password.length < 8) {
            throw new ValidationError('Email and a password of at least 8 characters are required.');
        }

        const user = await authService.registerUser(email, password, name);
        sendTokenResponse(res, user);
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ValidationError('Email and password are required.');
        }

        const user = await authService.loginUser(email, password);
        sendTokenResponse(res, user);
    } catch (error) {
        next(error);
    }
};

// --- Shared Auth ---

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new AuthError('User information not available on request.');
        }
        // req.user is already sanitized by authMiddleware
        res.status(200).json({ success: true, data: req.user });
    } catch (error) {
        next(error);
    }
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Clear the JWT cookie
        res.cookie('jwt', 'none', {
            expires: new Date(Date.now() + 5 * 1000), // Expire quickly
            httpOnly: true,
        });

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

// --- Google OAuth ---

export const googleAuthCallback = (req: Request, res: Response, next: NextFunction) => {
    // Passport handles the auth and attaches user/token to req.user/req.authInfo
    // We get here only on successful auth.

    const user = req.user as any;
    const { token } = req.authInfo as { token: string };

    if (!user || !token) {
        console.error('Google Auth Callback Error: Missing user or token.');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        // Redirect to frontend with an error query param
        return res.redirect(`${frontendUrl}/auth-error?message=Google Authentication Failed`);
    }

    // Set the JWT cookie
    res.cookie('jwt', token, JWT_COOKIE_OPTIONS);
    
    // Redirect to the frontend URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard?token=${token}`); // Pass token via URL/Fragment for client-side persistence
};