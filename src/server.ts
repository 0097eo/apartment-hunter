import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { notFound, errorHandler } from './middleware/errorMiddleware';
import prisma from './services/prisma';
import passport from 'passport';
import configurePassport from './config/passport';
import mainRouter from './routes/index';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// TODO Security Middleware (Rate Limit) will be added later.
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['http://localhost:3000'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true, // Allow cookies to be sent
}));

app.use(helmet()); // Secure apps by setting various HTTP headers
app.use(morgan('dev')); // Logger for HTTP requests
app.use(express.json()); // Body parser for JSON
app.use(cookieParser()); // Cookie parser for auth cookies
app.use(express.urlencoded({ extended: true })); // For form data
app.use(passport.initialize());
configurePassport(); // Configure passport strategies

// Basic Route
app.get('/', (req: Request, res: Response) => {
    res.send('Apartment Hunter Backend API is running...');
});

// ---API ROUTES--- //
app.use('/api', mainRouter);


// Error Handling Middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start Server
app.listen(PORT, async () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    try {
        await prisma.$connect();
        console.log('Database connected successfully.');
    } catch (error) {
        console.error('Database connection failed:', error);
    }
});

export default app;