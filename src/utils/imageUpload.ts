import cloudinary from "../config/cloudinary";
import { AuthError, NotFoundError } from "./customErrors";

export interface UploadResult {
    public_id: string;
    secure_url: string;
}


/**
 * Uploads an image buffer to Cloudinary.
 * @param buffer The image file buffer.
 * @param propertyId The ID of the property to use in the folder path.
 * @returns An object containing the secure URL and public ID.
 */

export const uploadImageToCloudinary = async (
    buffer: Buffer, 
    propertyId: string
): Promise<UploadResult> => {
    // Convert the buffer to a base64 Data URI for upload
    const dataURI = `data:image/jpeg;base64,${buffer.toString('base64')}`;

    // Cloudinary upload options
    const options = {
        folder: `apartment-hunter/properties/${propertyId}`,
        quality: 'auto:good' as const, // Auto-optimize quality
        fetch_format: 'auto' as const, // Auto-optimize format (webp, etc.)
    };

    try {
        const result = await cloudinary.uploader.upload(dataURI, options);
        console.log(`Cloudinary upload success: ${result.public_id}`);
        return {
            secure_url: result.secure_url,
            public_id: result.public_id,
        };
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw new AuthError('Failed to upload image to external service (Cloudinary).');
    }
};

/**
 * Deletes an image from Cloudinary using its public ID.
 * @param publicId The Cloudinary public ID of the image.
 * @returns The result object from Cloudinary delete API.
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<any> => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        
        if (result.result === 'not found') {
            console.warn(`Cloudinary deletion status for ${publicId}: Resource not found (safe to ignore).`);
            return result; // Return success as the desired state (deleted) is achieved
        }
        
        if (result.result !== 'ok') {
            // Treat any other non-'ok' result as a failure
            throw new Error(`Cloudinary deletion failed with status: ${result.result}`);
        }
        
        console.log(`Cloudinary deletion success: ${publicId}`);
        return result;

    } catch (error: any) {
        if (error.http_code === 404 || error.message?.includes('not found')) {

            throw new NotFoundError(`Image not found on Cloudinary: ${publicId}`);
        }
        console.error('Cloudinary Delete Error (Final Throw):', error);
        throw new AuthError(`Failed to delete image from external service (Cloudinary). Details: ${error.message || error}`);
    }
};

/**
 * Utility to extract public_id from a Cloudinary secure URL.
 * Assumes the URL format contains the folder path.
 * Example URL: .../apartment-hunter/properties/ID/image-name.jpg
 */

export const getPublicIdFromUrl = (url: string): string | null => {
    try {
        // Find the last segment of the path which contains the public ID + extension
        const urlParts = new URL(url).pathname.split('/');
        
        // Find the index of 'upload' which is just before the version number (vXXXXXXXXX)
        const uploadIndex = urlParts.indexOf('upload');
        
        if (uploadIndex === -1 || uploadIndex + 2 >= urlParts.length) {
            return null; // Invalid Cloudinary URL format
        }

        // The public ID starts after the version number (index uploadIndex + 2)
        const publicIdSegments = urlParts.slice(uploadIndex + 2);
        
        // The last segment contains the public_id and file extension (e.g., image-name.png)
        const lastSegment = publicIdSegments[publicIdSegments.length - 1];
        
        // Remove the file extension (everything from the last dot)
        publicIdSegments[publicIdSegments.length - 1] = lastSegment.substring(0, lastSegment.lastIndexOf('.'));
        
        // Join the path segments back together (e.g., apartment-hunter/properties/id/image-name)
        return publicIdSegments.join('/');

    } catch (error) {
        // Handle cases where new URL() fails (e.g., malformed URL)
        console.error('Failed to parse public ID from URL:', url, error);
        return null;
    }
};