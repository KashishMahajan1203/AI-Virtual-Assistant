import multer from "multer";   // Multer middleware for handling file uploads
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const uploadDirectory = fileURLToPath(new URL("../public/", import.meta.url));
const maxImageSize = 5 * 1024 * 1024;

// Raster formats only: SVG can carry scripts, so it is not accepted
const allowedImageTypes = {
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
}

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
        const extension = path.extname(file.originalname).toLowerCase()
        if (!allowedImageTypes[file.mimetype]?.includes(extension)) {
            const error = new Error("Only PNG, JPG, GIF or WebP images are allowed")
            error.status = 400
            cb(error)
            return
        }
        cb(null, true)
    },
})

// The browser-supplied mimetype can be faked, so check the file's real signature (magic bytes)
const hasImageSignature = (bytes) => {
    const startsWith = (signature, offset = 0) => signature.every((byte, i) => bytes[offset + i] === byte)
    return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])                 // PNG
        || startsWith([0xff, 0xd8, 0xff])                                                // JPEG
        || startsWith([0x47, 0x49, 0x46, 0x38])                                          // GIF
        || (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) // WebP
}

// Run after upload.single(): rejects (and deletes) files whose contents are not a real image
export const verifyImageFile = async (req, res, next) => {
    if (!req.file) return next()
    try {
        const handle = await fs.open(req.file.path)
        const { buffer } = await handle.read(Buffer.alloc(12), 0, 12, 0)
        await handle.close()
        if (hasImageSignature(buffer)) return next()
    } catch (error) {
        console.error("Could not inspect upload:", error.message)
    }
    await fs.rm(req.file.path, { force: true })
    return res.status(400).json({ message: "The uploaded file is not a valid image" })
}

export default upload    // Export upload middleware for use in routes that accept files
