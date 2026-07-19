import { Request, Response } from 'express';
import Review from '../../../shared/database/models/reviewModel';
import { StatusCodes } from 'http-status-codes';
import logger from '../../../shared/utils/logger';
import { cacheService, CACHE_CONFIG } from '../../../shared/utils/cacheService';
import User from '../../../shared/database/models/userModel';
import UserTrustProfile from '../../../shared/database/models/userTrustProfileModel';
import { triggerContentModeration } from '../../../shared/services/trustEngine';


// Get all reviews with optional filtering and sorting
export const getAllReviews = async (req: Request, res: Response) => {
    try {
        const { category, rating, search, sortBy } = req.query;

        let query: any = {};

        // Filtering
        if (category && category !== 'all') {
            query.tripType = category;
        }
        if (rating && rating !== 'all') {
            // If rating is '4', we might want 4 stars. If '4+' meant 4 and above, logic would be different.
            // Based on frontend '4' usually means 4 stars. Let's assume exact match for now or implements gte based on requirements.
            // Frontend says "4+ Stars" for value "4". So let's do $gte
            query.rating = { $gte: Number(rating) };
        }
        if (search) {
            query.$or = [
                { comment: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { userName: { $regex: search, $options: 'i' } }
            ];
        }

        // Sorting
        let sortOption: any = { createdAt: -1 }; // Default newest
        if (sortBy === 'oldest') {
            sortOption = { createdAt: 1 };
        } else if (sortBy === 'highest') {
            sortOption = { rating: -1 };
        } else if (sortBy === 'helpful') {
            sortOption = { helpfulCount: -1 };
        }

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 6;
        const skip = (page - 1) * limit;

        const reviews = await Review.find(query)
            .populate('tripId')
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .lean();
            
        const total = await Review.countDocuments(query);

        // Fetch users for these reviews to enrich with latest profile picture
        const firebaseUids = [...new Set(reviews.map((r: any) => r.firebaseUid || r.userId).filter(Boolean))];
        const users = await User.find({ firebaseUid: { $in: firebaseUids } }).lean();
        const userMap = new Map(users.map(u => [u.firebaseUid, u]));

        const enrichedReviews = reviews.map((review: any) => {
            const user = userMap.get(review.firebaseUid || review.userId);
            if (user) {
                review.userAvatar = review.userAvatar || user.profilepicture || '';
                review.userName = review.userName || user.username || user.fullname || user.firstName || 'Traveler';
            }
            return review;
        });

        res.status(StatusCodes.OK).json({
            success: true,
            count: enrichedReviews.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: enrichedReviews
        });
    } catch (error) {
        logger.error('Error fetching reviews:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server Error' });
    }
};

// Create a new review
export const createReview = async (req: Request, res: Response) => {
    try {
        const { userName, userAvatar, location, tripType, tripDuration, travelers, rating, comment, images, tripId } = req.body;
        const firebaseUid = (req as any).user?.firebaseUid;

        if (!firebaseUid) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        }

        // 🛡️ Automated Actions: Limit users with trustScore < 30
        const trustProfile = await UserTrustProfile.findOne({ userId: firebaseUid });
        if (trustProfile && trustProfile.trustScore < 30) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: 'Your account features have been restricted due to low trust score. Please contact support.'
            });
        }

        const reviewData: any = {
            userId: firebaseUid,
            firebaseUid: firebaseUid,
            userName,
            userAvatar,
            location,
            tripType,
            tripDuration,
            travelers,
            rating,
            comment,
            images
        };

        if (tripId && tripId.trim() !== '') {
            reviewData.tripId = tripId;
        }

        const review = await Review.create(reviewData);

        // 🛡️ Run Real-time AI Trust Moderation asynchronously
        triggerContentModeration(review._id.toString(), 'REVIEW', firebaseUid, comment);

        // 🕒 Invalidate all review related cache
        await cacheService.invalidatePattern(CACHE_CONFIG.PREFIX.REVIEWS + ':*');

        res.status(StatusCodes.CREATED).json({ success: true, data: review });
    } catch (error) {
        logger.error('Error creating review:', error);
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid data', error });
    }
};

// Like a review
export const likeReview = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const review = await Review.findByIdAndUpdate(
            id,
            { $inc: { helpfulCount: 1 } },
            { new: true }
        );
        if (!review) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Review not found' });
        }

        // 🕒 Invalidate all review related cache
        await cacheService.invalidatePattern(CACHE_CONFIG.PREFIX.REVIEWS + ':*');

        res.status(StatusCodes.OK).json({ success: true, data: review });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server Error' });
    }
};
