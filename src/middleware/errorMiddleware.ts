import { Request, Response, NextFunction } from 'express';

// Placeholder for the full error handling
export const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Determine status code (default 500)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    // Basic error response structure
    res.json({
        success: false,
        error: {
            message: err.message,
            // Only send stack trace in development
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        },
    });
};