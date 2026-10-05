import multer from "multer";   // Multer middleware for handling file uploads
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const uploadDirectory = fileURLToPath(new URL("../public/", import.meta.url));
const maxImageSize = 5 * 1024 * 1024;

// Configure disk storage for uploaded files
const storage = multer.diskStorage({
    // Define the local folder where uploaded files will be stored
    destination: (req, file, cb) => {
        cb(null, uploadDirectory)
    },
    // Define the naming convention for saved files
    filename: (req, file, cb) => {
        cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: maxImageSize, files: 1 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            const error = new Error("Only image files are allowed")
            error.status = 400
            cb(error)
            return
        }
        cb(null, true)
    },
})

export default upload    // Export upload middleware for use in routes that accept files
