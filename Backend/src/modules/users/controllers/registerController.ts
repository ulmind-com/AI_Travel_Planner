import { Request, Response } from 'express';
import User from '../../../shared/database/models/userModel';
import { StatusCodes } from 'http-status-codes';
import logger from '../../../shared/utils/logger';
import { sendEmail } from '../../../shared/services/mailService';

export const registerUser = async (req: Request, res: Response) => {
    try {
        // Even though it is called 'firebaseUid' in the DB, it is actually the Firebase UID now.
        // We do this to ensure backward compatibility with the existing database.
        const { firebaseUid, email, username, profileImage } = req.body;

        if (!firebaseUid || !email) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'firebaseUid (uid) and email are required'
            });
        }

        // Check if user already exists
        let user = await User.findOne({ firebaseUid });
        let isNewUser = false;
        
        if (user) {
            // Update existing user with latest Firebase data
            user.email = email;
            if (username && !user.username) user.username = username; // Only set if empty
            if (profileImage && !user.profileImage) user.profileImage = profileImage;
            await user.save();
        } else {
            // Create new user
            user = new User({
                firebaseUid,
                email,
                username: username || email.split('@')[0],
                profileImage: profileImage || '',
                role: 'user'
            });
            await user.save();
            isNewUser = true;
        }

        if (isNewUser) {
            // Send Welcome Email asynchronously
            sendEmail({
                to: email,
                subject: 'Welcome to AdventureNexus 🌍',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 8px;">
                        <h2 style="color: #2F80ED;">Welcome ${user.username || 'Traveler'}! 🌍</h2>
                        <p style="font-size: 16px; line-height: 1.6; color: #333;">Your adventure starts now. Explore premium itineraries, customize your plans using AI, and connect with fellow travelers safely.</p>
                        <a href="http://localhost:5173" style="display: inline-block; padding: 12px 24px; background-color: #2F80ED; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Start Exploring 🚀</a>
                    </div>
                `
            }).catch(err => {
                logger.error('Failed to send welcome email:', err);
            });
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'User registered/synced successfully',
            data: user
        });

    } catch (error: any) {
        logger.error('Error registering user:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
};
