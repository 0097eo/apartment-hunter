import { v2 as cloudinary, ConfigOptions } from 'cloudinary';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error("Missing Cloudinary environment variables!");
    // Fail fast if credentials are not set
    throw new Error("Cloudinary configuration missing. Please check .env file.");
}

// Configure Cloudinary
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true, // Always use HTTPS
} as ConfigOptions); // Cast to allow partial type safety while using v2 as cloudinary


export default cloudinary;