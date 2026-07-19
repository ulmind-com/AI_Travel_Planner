import { NextFunction, Request, Response } from "express";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import User, { IUser } from "../database/models/userModel";
import logger from "../utils/logger";
import admin from "../config/firebase";

/**
 * Middleware to protect routes using Firebase Authentication.
 * Verifies the Bearer token and attaches the user object to the request.
 */
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    logger.http("🔐 Auth Middleware: Request received");

    try {
        // 1. Check for Authorization Header
        if (!req.headers?.authorization) {
            logger.warn("❌ No authorization header");
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: "Failed",
                message: "Authentication failed. No token provided.",
            });
        }

        const authHeader = req.headers.authorization;

        // 2. Validate Token Format (Bearer <token>)
        if (!authHeader.startsWith("Bearer ")) {
            logger.warn("❌ Invalid token format");
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: "Failed",
                message: "Invalid token format. Expected 'Bearer <token>'.",
            });
        }

        // 3. Extract Token
        const token = authHeader.split(" ")[1];

        // 4. Verify Firebase Token
        if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
            logger.warn(`❌ Token verification failed: received empty, null, or undefined token string.`);
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: "Failed",
                message: "Authentication failed. Token is missing or invalid.",
            });
        }

        let firebaseUid: string;
        let decodedToken: admin.auth.DecodedIdToken;

        try {
            decodedToken = await admin.auth().verifyIdToken(token);
            if (!decodedToken || !decodedToken.uid) {
                logger.warn("❌ Invalid token payload - no 'uid' field");
                return res.status(StatusCodes.UNAUTHORIZED).json({
                    status: "Failed",
                    message: "Invalid token payload.",
                });
            }
            firebaseUid = decodedToken.uid;
        } catch (decodeError) {
            logger.error("❌ Token decode error:", decodeError);
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: "Failed",
                message: "Invalid token format or expired token.",
            });
        }

        let user: IUser | null = await User.findOne({ firebaseUid });

        if (!user) {
            // Check if user exists by email (migration from Clerk)
            if (decodedToken.email) {
                user = await User.findOne({ email: decodedToken.email.toLowerCase().trim() });
            }

            if (user) {
                logger.info(`🔄 Linking existing account (${user.email}) to new Firebase UID`);
                user.firebaseUid = firebaseUid;
                await user.save();
            } else {
                logger.info("🆕 User not found in database. Auto-creating from Firebase token...");
                
                // Generate a safe, unique username
                const uniqueSuffix = Math.random().toString(36).substring(2, 8);
                let baseName = decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'traveler');
                let safeUsername = baseName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + '_' + uniqueSuffix;

                user = new User({
                    firebaseUid,
                    email: decodedToken.email ? decodedToken.email.toLowerCase().trim() : `${firebaseUid}@placeholder.com`,
                    username: safeUsername,
                    fullname: decodedToken.name || '',
                    profilepicture: decodedToken.picture || '',
                    role: 'user'
                });
                await user.save();
                logger.info("✅ User auto-created successfully!");
            }
        }

        // 6. Attach User to Request Object for downstream use
        req.user = {
            _id: user._id.toString(),
            firebaseUid: user.firebaseUid,
            role: user.role || "user",
            email: user.email,
            username: user.username,
            isBanned: user.isBanned || false,
            banReason: user.banReason || "",
        };

        logger.info("✅ Auth Middleware: User authenticated successfully");
        next(); // Proceed to controller

    } catch (error) {
        logger.error("💥 Auth Middleware Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "Failed",
            message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        });
    }
};

/**
 * Middleware that ONLY verifies the Firebase Token.
 * It does NOT check if the user exists in the database.
 * Used for registration/sync endpoints.
 */
export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
        if (!req.headers?.authorization || !req.headers.authorization.startsWith("Bearer ")) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: "Failed",
                message: "Authentication failed. No token provided.",
            });
        }

        const token = req.headers.authorization.split(" ")[1];
        
        if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: "Failed",
                message: "Authentication failed. Token is missing or invalid.",
            });
        }

        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            if (!decodedToken || !decodedToken.uid) {
                return res.status(StatusCodes.UNAUTHORIZED).json({
                    status: "Failed",
                    message: "Invalid token payload.",
                });
            }
            
            // Attach minimal info to request for the controller
            req.user = {
                _id: "",
                firebaseUid: decodedToken.uid,
                role: "user",
                email: decodedToken.email || "",
                username: "",
                isBanned: false,
                banReason: "",
            };
            
            next();
        } catch (error) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: "Failed",
                message: "Invalid token format or expired token.",
            });
        }
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "Failed",
            message: "Internal server error during token verification.",
        });
    }
};

/**
 * Middleware that optionally extracts user ID but doesn't block the request.
 * Useful for public routes that change behavior if a user is logged in.
 */
export const optionalProtect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.headers?.authorization || !req.headers.authorization.startsWith("Bearer ")) {
            return next();
        }

        const token = req.headers.authorization.split(" ")[1];
        if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
            return next();
        }
        const decodedToken = await admin.auth().verifyIdToken(token);

        if (decodedToken && decodedToken.uid) {
            const user: IUser | null = await User.findOne({ firebaseUid: decodedToken.uid });
            if (user) {
                req.user = {
                    _id: user._id.toString(),
                    firebaseUid: user.firebaseUid,
                    role: user.role || "user",
                    email: user.email,
                    username: user.username,
                    isBanned: user.isBanned || false,
                    banReason: user.banReason || "",
                };
            }
        }
    } catch (error) {
        logger.warn("⚠️ Optional Auth failed, continuing as guest");
    }
    next();
};

export default protect;

