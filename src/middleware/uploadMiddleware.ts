import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ValidationError } from '../utils/customErrors';

// Configure storage for multer - memory storage is used because we upload to Cloudinary immediately
const storage = multer.memoryStorage();

// Multer instance for handling multi-image uploads
const listingUpload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 10, // Max 10 files
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            // Pass a ValidationError to the error handler
            cb(new ValidationError('Only image files are allowed.'));
        }
    }
}).array('images', 10); // 'images' is the field name in the form data, maxCount 10

/**
 * Middleware to handle file uploads for listings using Multer.
 * Attaches 'files' array to the request object.
 */
export const uploadImages = (req: Request, res: Response, next: NextFunction) => {
    listingUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred (e.g., file count, size)
            return next(new ValidationError(`File upload error: ${err.message}`));
        } else if (err) {
            // Other errors (e.g., fileFilter error)
            return next(err);
        }
        // Success
        next();
    });
};