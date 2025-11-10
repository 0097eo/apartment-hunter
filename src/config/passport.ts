import passport from 'passport';
import { Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';
import { findOrCreateGoogleUser, findUserById } from '../services/auth.service';
import { generateToken } from '../utils/jwt';


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
    console.error("Missing Google OAuth environment variables!");
    // This is not a fatal error during server startup, but auth will fail.
}

/**
 * Initializes and configures Passport.js strategies.
 */
const configurePassport = () => {
    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CALLBACK_URL) {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: GOOGLE_CLIENT_ID,
                    clientSecret: GOOGLE_CLIENT_SECRET,
                    callbackURL: GOOGLE_CALLBACK_URL,
                },
                async (accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) => {
                    try {
                        const email = profile.emails?.[0].value;
                        if (!email) {
                            return done(new Error('Google profile must include an email address.'), undefined);
                        }

                        const name = profile.displayName;
                        const profilePicture = profile.photos?.[0].value;
                        const googleId = profile.id;

                        const user = await findOrCreateGoogleUser(googleId, email, name, profilePicture);

                        // Generate a JWT for the user to be used for redirection
                        const token = generateToken(user);
                        
                        // Pass the token in the info argument
                        return done(null, user, { token });
                    } catch (error) {
                        console.error('Passport Google Strategy Error:', error);
                        return done(error as Error, undefined);
                    }
                }
            )
        );
    }

    // Passport serialization is not strictly needed for stateless JWT, 
    // but required by Passport framework
    passport.serializeUser((user: any, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await findUserById(id);
            done(null, user);
        } catch (error) {
            done(error, undefined);
        }
    });
};

export default configurePassport;