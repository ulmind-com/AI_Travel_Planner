import mongoose, { Document, Schema, model } from 'mongoose';

export interface IUserPreferenceProfile extends Document {
    userId: string; // References User firebaseUid
    preferredDestinations: string[];
    budgetRange: { min: number; max: number };
    travelStyle: ('luxury' | 'budget' | 'adventure')[];
    preferredClimate: string[];
    activityScore: Record<string, number>;
    aiPredictionText: string;
    lastUpdated: Date;
}

const userPreferenceProfileSchema = new Schema<IUserPreferenceProfile>({
    userId: { type: String, required: true, unique: true, index: true },
    preferredDestinations: { type: [String], default: [] },
    budgetRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 1000000 }
    },
    travelStyle: { 
        type: [String], 
        enum: ['luxury', 'budget', 'adventure'],
        default: [] 
    },
    preferredClimate: { type: [String], default: [] },
    activityScore: { type: Schema.Types.Mixed, default: {} },
    aiPredictionText: { type: String, default: '' },
    lastUpdated: { type: Date, default: Date.now }
});

const UserPreferenceProfile = model<IUserPreferenceProfile>('UserPreferenceProfile', userPreferenceProfileSchema);
export default UserPreferenceProfile;
