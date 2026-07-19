import { Schema, model, Document } from 'mongoose';

export interface IUserTrustProfile extends Document {
    userId: string; // Firebase UID or Mongo _id
    trustScore: number;
    toxicityScore: number;
    spamScore: number;
    reportCount: number;
    fakeReviewScore: number;
    lastUpdated: Date;
}

const userTrustProfileSchema = new Schema<IUserTrustProfile>({
    userId: { type: String, required: true, unique: true, index: true },
    trustScore: { type: Number, default: 100, min: 0, max: 100 },
    toxicityScore: { type: Number, default: 0, min: 0, max: 1 },
    spamScore: { type: Number, default: 0, min: 0, max: 1 },
    reportCount: { type: Number, default: 0, min: 0 },
    fakeReviewScore: { type: Number, default: 0, min: 0, max: 1 },
    lastUpdated: { type: Date, default: Date.now }
});

const UserTrustProfile = model<IUserTrustProfile>('UserTrustProfile', userTrustProfileSchema);
export default UserTrustProfile;
