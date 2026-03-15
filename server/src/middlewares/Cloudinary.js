/**
 * Cloudinary image upload/delete helpers.
 *
 * Wraps the Cloudinary v2 SDK to provide two simple async functions:
 *  - `uploadImage` – uploads a local file path to Cloudinary and deletes
 *    the temp file afterwards (regardless of success or failure)
 *  - `deleteImage` – deletes an image from Cloudinary by reconstructing
 *    its public_id from the stored URL and folder name
 *
 * Required environment variables:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import AppError from '../utils/AppError.js';

dotenv.config();

// Configure Cloudinary once at module load time
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


/**
 * Uploads a local image file to Cloudinary and removes the temp file.
 *
 * @param {string} image      - Absolute path to the local file (written by Multer)
 * @param {string} folderName - Cloudinary folder to upload into (default: "avatars")
 * @returns {Promise<Object>} Cloudinary upload result (includes `secure_url`, `public_id`, etc.)
 * @throws {AppError} 400 if `image` is falsy; 500 on Cloudinary failure
 */
const uploadImage = async (image, folderName = "avatars") => {
    try {
        if (!image) {
            throw new AppError("Image is required", 400)
        }

        const result = await cloudinary.uploader.upload(image, {
            folder: folderName
        })

        if (!result) {
            throw new AppError("Response from Cloudinary is empty. Failed to upload image to Cloudinary", 500)
        }

        // Remove the temporary local file after successful upload
        if (fs.existsSync(image)) fs.unlinkSync(image)
        return result
    } catch (error) {
        // Always clean up the temp file, even on failure
        if (fs.existsSync(image)) fs.unlinkSync(image)
        throw new AppError("Failed to upload image to Cloudinary", 500)
    }
}

/**
 * Deletes an image from Cloudinary using its public_id.
 *
 * The public_id is reconstructed from the Cloudinary URL by extracting the
 * filename (without extension) and prepending the folder name:
 *   "https://res.cloudinary.com/.../avatars/abc123.jpg" → public_id: "avatars/abc123"
 *
 * @param {string} imageUrl   - Full Cloudinary secure URL of the image to delete
 * @param {string} folderName - Cloudinary folder the image resides in (default: "avatars")
 * @returns {Promise<boolean>} `true` if deleted successfully, `false` otherwise
 * @throws {AppError} 400 if `imageUrl` is falsy; 500 on Cloudinary failure
 */
const deleteImage = async (imageUrl, folderName = "avatars") => {
    try {
        if (!imageUrl) {
            throw new AppError("Image URL is required", 400)
        }

        // Extract the public_id: "<folder>/<filename-without-extension>"
        const publicId = folderName + "/" + imageUrl.split("/").pop().split(".")[0]
        const result = await cloudinary.uploader.destroy(publicId)

        if (!result) {
            throw new AppError("Failed to delete image from Cloudinary", 500)
        }

        if (result.result === "ok") {
            return true
        }
        return false
    } catch (error) {
        if (error.isOperational) throw error;
        throw new AppError("Failed to delete image from Cloudinary", 500)
    }
}

export { uploadImage, deleteImage }
