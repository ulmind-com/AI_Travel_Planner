import express, { Router } from 'express';
import userProfile, {
    CustomRequestUserProfileController,
} from '../controllers/userProfileController';
import { updateProfile } from '../controllers/updateProfileController';
import { protect, verifyFirebaseToken } from '../../../shared/middleware/firebaseAuthMiddleware';
import { upload } from '../../../shared/middleware/multer';
import {
    getUserDashboardProfile,
    getUserDashboardPosts,
    getUserDashboardExperiences,
    getUserDashboardComments,
    getUserDashboardLikes,
    getUserDashboardGroups
} from '../controllers/profileDashboardController';
import { uploadPublicKey, getPublicKey } from '../controllers/e2eeKeyController';
import { registerUser } from '../controllers/registerController';

const route: Router = express.Router();

// Current logged in user profile (Firebase session sync)
route.get('/profile', protect, (req, res, next) => {
    userProfile(req as CustomRequestUserProfileController, res, next);
});

// Register user from Firebase
route.post('/register', verifyFirebaseToken, registerUser);

// Update profile
route.patch('/profile', protect, upload.single('image'), updateProfile);
route.put('/update', protect, upload.single('image'), updateProfile);

// E2EE Key Exchange
route.post('/e2ee/public-key', protect, uploadPublicKey);
route.get('/e2ee/public-key/:firebaseUid', protect, getPublicKey);

// Social control center and dashboard content routes
route.get('/:firebaseUid/profile', protect, getUserDashboardProfile);
route.get('/:firebaseUid/posts', protect, getUserDashboardPosts);
route.get('/:firebaseUid/experiences', protect, getUserDashboardExperiences);
route.get('/:firebaseUid/comments', protect, getUserDashboardComments);
route.get('/:firebaseUid/likes', protect, getUserDashboardLikes);
route.get('/:firebaseUid/groups', protect, getUserDashboardGroups);

export default route;
