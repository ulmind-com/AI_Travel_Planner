import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { config } from '../config/config';

dotenv.config();

cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_CLOUD_API_KEY,
    api_secret: config.CLOUDINARY_CLOUD_API_SECRET,
});

export const deleteFromCloudinary = async (imageUrl: string) => {
    try {
        if (!imageUrl || !imageUrl.includes('cloudinary.com')) return;
        
        // Extract publicId: URL is typically like:
        // https://res.cloudinary.com/dxy/image/upload/v1234/adventurenexus/profiles/abc.jpg
        const startPath = imageUrl.substring(imageUrl.indexOf('adventurenexus/'));
        if (startPath) {
            const publicId = startPath.substring(0, startPath.lastIndexOf('.'));
            await cloudinary.uploader.destroy(publicId);
            console.log(`✅ Deleted old image from Cloudinary: ${publicId}`);
        }
    } catch (error) {
        console.error('❌ Failed to delete image from Cloudinary:', error);
    }
};

export default cloudinary;
