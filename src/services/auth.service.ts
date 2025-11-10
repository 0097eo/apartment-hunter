import prisma from './prisma';
import bcrypt from 'bcrypt';
import { User, AuthProvider } from '../generated/prisma';
import { AuthError, NotFoundError } from '../utils/customErrors';

const SALT_ROUNDS = 10;

// Utility function to strip sensitive data
const sanitizeUser = (user: User): Omit<User, 'password_hash'> => {
    const { password_hash, ...safeUser } = user;
    return safeUser;
};

/**
 * Hashes a plain text password.
 */
export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compares a plain text password with a hash.
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

/**
 * Registers a new local user.
 */
export const registerUser = async (email: string, password: string, name?: string): Promise<Omit<User, 'password_hash'>> => {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
        throw new AuthError('User with this email already exists.');
    }

    const password_hash = await hashPassword(password);

    const newUser = await prisma.user.create({
        data: {
            email,
            password_hash,
            name,
            auth_provider: AuthProvider.local,
        },
    });

    console.log(`New local user registered: ${newUser.id}`);
    return sanitizeUser(newUser) as User;
};

/**
 * Logs in a local user.
 */
export const loginUser = async (email: string, password: string): Promise<Omit<User, 'password_hash'>> => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.auth_provider !== AuthProvider.local) {
        throw new AuthError('Invalid credentials or authentication provider mismatch.');
    }

    if (!user.password_hash) {
        throw new AuthError('Account not set up for password login. Try Google login.');
    }

    const isMatch = await comparePassword(password, user.password_hash);

    if (!isMatch) {
        throw new AuthError('Invalid credentials.');
    }

    console.log(`Local user logged in: ${user.id}`);
    return sanitizeUser(user) as User;
};

/**
 * Finds a user by ID and returns safe data.
 */
export const findUserById = async (id: string): Promise<Omit<User, 'password_hash'>> => {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
        throw new NotFoundError('User not found.');
    }

    return sanitizeUser(user) as User;
};

/**
 * Finds or creates a user based on Google profile.
 */
export const findOrCreateGoogleUser = async (
    googleId: string,
    email: string,
    name: string,
    profilePicture: string
): Promise<Omit<User, 'password_hash'>> => {
    // 1. Try to find by Google ID
    let user = await prisma.user.findUnique({ where: { google_id: googleId } });

    if (user) {
        // Existing Google user, update name/picture
        user = await prisma.user.update({
            where: { id: user.id },
            data: {
                name,
                profile_picture: profilePicture,
                auth_provider: AuthProvider.google,
            },
        });
        console.log(`Existing Google user logged in: ${user.id}`);
        return sanitizeUser(user) as User;
    }

    // 2. Try to find by email (for linking existing accounts)
    user = await prisma.user.findUnique({ where: { email } });

    if (user) {
        // Existing local user, link Google ID
        user = await prisma.user.update({
            where: { id: user.id },
            data: {
                google_id: googleId,
                profile_picture: user.profile_picture || profilePicture,
                auth_provider: AuthProvider.google,
                password_hash: user.password_hash || null, // Clear hash if local provider wasn't used/needed
            },
        });
        console.log(`Local user linked to Google: ${user.id}`);
        return sanitizeUser(user) as User;
    }

    // 3. New user
    const newUser = await prisma.user.create({
        data: {
            email,
            name,
            google_id: googleId,
            profile_picture: profilePicture,
            auth_provider: AuthProvider.google,
        },
    });

    console.log(`New Google user created: ${newUser.id}`);
    return sanitizeUser(newUser) as User;
};