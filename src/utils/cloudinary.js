import { v2 as cloudinary } from 'cloudinary';
import {fs} from 'fs';

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME ,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    // Upload function
    const uploadCloudinary = async (localFilePath) => {
        try {
            if (!localFilePath) {
                throw new Error('File path is required for upload');
            }
            const result = await cloudinary.uploader.upload(localFilePath, {
                resource_type: 'auto' // Automatically determine the resource type (image, video, etc.)
            });
            fs.unlinkSync(localFilePath); // Delete the file after upload
            return result; 
        } catch (error) {
            fs.unlinkSync(localFilePath); // Ensure the file is deleted even if upload fails
            console.error('Error uploading to Cloudinary:', error);
            throw error;
            return null; // Return null in case of error
        }
    }

    export  {uploadCloudinary};