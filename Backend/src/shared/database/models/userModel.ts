import mongoose, { Document, Schema, model } from 'mongoose'; // Mongoose for MongoDB modeling

// User Interface Definition
export interface IUser extends Document {
    firebaseUid: string; // ID from Firebase Authentication
    email: string;      // User's email address
    firstName?: string; // Optional first name
    lastName?: string;  // Optional last name
    username?: string;  // Unique username
    profilepicture?: string; // URL to profile picture
    phonenumber?: number; // Contact number
    fullname?: string;    // Full name (derived or stored)
    role: string;         // User role (e.g., user, admin)
    gender?: string;      // Gender
    country?: string;     // User's country
    preferences?: string[]; // Travel preferences (e.g., 'adventure', 'luxury')
    plans?: string[];       // Array of Plan IDs created by the user
    likedPlans?: string[];  // Array of Plan IDs liked by the user (IDs)
    followers?: string[];   // Array of firebaseUids following this user
    following?: string[];   // Array of firebaseUids this user is following
    bio?: string;           // User bio
    coverImage?: string;    // URL to cover/background image
    isPrivate?: boolean;    // Whether the profile is public or private
    savedPosts?: Schema.Types.ObjectId[]; // Bookmarked community posts
    socialLinks?: {
        twitter?: string;
        instagram?: string;
        website?: string;
    };
    onlineStatus: 'online' | 'offline';
    lastActive?: Date;      // Last active timestamp
    isBanned?: boolean;     // Ban status
    banReason?: string;     // Reason for the ban
    e2eePublicKey?: string; // E2EE public key (X25519, base64)
    createdAt: Date;        // Timestamp
    updatedAt: Date;        // Timestamp
}

// Enum for Gender
enum Gender {
    Male = 'male',
    Female = 'female',
    Other = 'other'
}

// User Schema Definition
const userSchema = new Schema<IUser>(
    {
        firebaseUid: {
            type: String,
            required: true,
            unique: true, // Ensures one account per Firebase UID
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true, // Ensures email uniqueness
            lowercase: true,
            trim: true
        },
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        username: { type: String, unique: true, sparse: true, trim: true }, // Sparse allows nulls to be unique-ish (ignored)
        profilepicture: { type: String, default: "" },
        phonenumber: {
            type: Number,
            validate: {
                validator: function (v: number) {
                    // Check if value is null OR exactly 10 digits
                    return v == null || /^\d{10}$/.test(v.toString());
                },
                message: 'Phone number must be exactly 10 digits'
            },
            default: null
        },
        fullname: { type: String, default: "" },
        role: {
            type: String,
            enum: ['user', 'admin'], // Restrict to specific roles
            default: 'user',
        },
        gender: {
            type: String,
            enum: Object.values(Gender),
        },
        country: { type: String, default: "" },
        preferences: {
            type: [String],
            default: [],
        },
        plans: [
            {
                type: mongoose.Schema.Types.ObjectId, // Reference to 'Plan' model
                ref: 'Plan',
            },
        ],
        likedPlans: [{ type: String }],
        followers: [{ type: String, ref: 'User' }], // Firebase UIDs
        following: [{ type: String, ref: 'User' }], // Firebase UIDs
        bio: { type: String, default: "" },
        coverImage: { type: String, default: "" },
        isPrivate: { type: Boolean, default: false },
        savedPosts: [{ type: Schema.Types.ObjectId, ref: 'CommunityPost' }],
        socialLinks: {
            twitter: { type: String, default: "" },
            instagram: { type: String, default: "" },
            website: { type: String, default: "" },
        },
        onlineStatus: { type: String, enum: ['online', 'offline'], default: 'offline' },
        isBanned: { type: Boolean, default: false },
        banReason: { type: String, default: "" },
        e2eePublicKey: { type: String, default: "" },
        lastActive: { type: Date, default: Date.now },
    },
    {
        timestamps: true, // Automatically manage createdAt and updatedAt
    }
);

// Middleware: Handle Duplicate Key Errors (e.g., Email or Username already exists)
userSchema.post('save', function (error: any, doc: any, next: any) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        if (error.keyPattern.firebaseUid) {
            next(new Error('User with this Firebase UID already exists'));
        } else if (error.keyPattern.username) {
            next(new Error('Username already taken'));
        } else if (error.keyPattern.email) {
            next(new Error('Email already registered'));
        } else {
            const fields = Object.keys(error.keyPattern).join(', ');
            next(new Error(`Duplicate field error: ${fields}`));
        }
    } else {
        next(error);
    }
});

const User = model<IUser>('User', userSchema);
export default User;
