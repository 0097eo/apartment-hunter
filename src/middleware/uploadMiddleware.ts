// src/middleware/uploadMiddleware.ts

import multer from 'multer';
import { Request } from 'express';
import { ValidationError } from '../utils/customErrors';

// File filter to accept only images
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
        // Check for common image formats
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        
        if (fileExtension && allowedExtensions.includes(fileExtension)) {
            cb(null, true); // Success: null for error, true to accept
        } else {
             // Reject: Invalid extension. Pass Error as first argument.
            cb(new ValidationError('Invalid file extension. Only JPG, JPEG, PNG, and WEBP images are allowed.'));
        }
    } else {
        // Reject: Not an image MIME type. Pass Error as first argument.
        cb(new ValidationError('Invalid file type. Only images are allowed.'));
    }
};

// Multer configuration for file storage in memory (buffer)
// This is necessary for Cloudinary which prefers to upload directly from a buffer/stream.
const storage = multer.memoryStorage();

// Max 10 images per request, max 10MB per file
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 10, // Max 10 files
    },
    fileFilter: imageFileFilter,
});

// Middleware function for uploading multiple images
export const uploadImages = upload.array('images', 10); // 'images' is the field name in the form-data