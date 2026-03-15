/**
 * Multer file-upload middleware configuration.
 *
 * Configures Multer for disk storage with the following constraints:
 *  - Destination: `src/public/uploads/` (created automatically if absent)
 *  - Filename:    `<timestamp>-<originalname>` to avoid collisions
 *  - Allowed types: JPEG, JPG, PNG, GIF, WEBP (images only)
 *  - Max file size: 5 MB
 *
 * Usage in routes:
 *   import upload from '../middlewares/multer.js';
 *   router.post('/avatar', upload.single('avatar'), handler);  // single file
 *   router.post('/files',  upload.array('files', 5), handler); // up to 5 files
 *
 * After the controller finishes processing, the Cloudinary helper
 * (`src/middlewares/Cloudinary.js`) pushes the file to Cloudinary and
 * deletes the local temp copy.
 */
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";



// __dirname is not available in ES modules — reconstruct it from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the uploads directory exists before Multer tries to write to it
const uploadPath = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}


// Store files on disk using a timestamp-prefixed filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

// Reject any file that is not an image
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const isValid = allowedTypes.test(file.mimetype);
    if (isValid) {
        cb(null, true);
    } else {
        cb(new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed"), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter,
});

export default upload;
