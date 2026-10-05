import { v2 as cloudinary } from 'cloudinary'   // Import Cloudinary SDK (v2)
import fs from "fs"                              // File system module for deleting files

// Utility function to upload a file to Cloudinary
const uploadOnCloudinary = async (filePath) => {

    // Configure Cloudinary using environment variables
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        const uploadResult = await cloudinary.uploader.upload(filePath)
        return uploadResult.secure_url
    } catch (error) {
        throw new Error(`Cloudinary upload failed: ${error.message}`)
    } finally {
        try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        } catch (error) {
            console.error("Could not remove temporary upload:", error.message)
        }
    }
}

// Export the upload function for reuse
export default uploadOnCloudinary
