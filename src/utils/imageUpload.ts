import cloudinary from "../config/cloudinary";
import { AuthError } from "./customErrors";

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
        if (result.result !== 'ok') {
            // Log if deletion was not explicitly 'ok', but don't throw for 404 (file not found)
            console.warn(`Cloudinary deletion status for ${publicId}: ${result.result}`);
        }
        console.log(`Cloudinary deletion success: ${publicId}`);
        return result;
    } catch (error) {
        console.error('Cloudinary Delete Error:', error);
        throw new AuthError('Failed to delete image from external service (Cloudinary).');
    }
};

/**
 * Utility to extract public_id from a Cloudinary secure URL.
 * Assumes the URL format contains the folder path.
 * Example URL: .../apartment-hunter/properties/ID/image-name.jpg
 */
export const getPublicIdFromUrl = (url: string): string | null => {
    try {
        // Regex to match the part after /vXXXXXXXXX/ and before the extension
        // It finds the folder structure: apartment-hunter/properties/{id}/...
        const parts = url.split('/');
        const versionIndex = parts.findIndex(part => part.startsWith('v'));
        
        if (versionIndex === -1 || versionIndex + 1 >= parts.length) {
             return null;
        }

        // Get the part of the URL that contains the public ID structure (e.g., apartment-hunter/properties/id/image-name)
        const publicIdParts = parts.slice(versionIndex + 1);
        
        // Remove the file extension from the last part
        const lastPart = publicIdParts[publicIdParts.length - 1];
        publicIdParts[publicIdParts.length - 1] = lastPart.substring(0, lastPart.lastIndexOf('.'));
        
        // Join back to form the public ID
        return publicIdParts.join('/');
        
    } catch (error) {
        console.error('Failed to parse public ID from URL:', url);
        return null;
    }
};