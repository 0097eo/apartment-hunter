import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { AuthError } from './customErrors';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN =  7 * 24 * 60 * 60; // 7 Days in seconds

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables.');
}

export const generateToken = (user: { id: string; email: string }): string => {
  const payload = { id: user.id, email: user.email };
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };

  // Explicitly cast secret to jwt.Secret so TypeScript picks the correct overload
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, options);
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET as jwt.Secret) as JwtPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new AuthError('Invalid or expired token.');
  }
};
