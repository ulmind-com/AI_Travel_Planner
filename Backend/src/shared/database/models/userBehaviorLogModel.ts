import mongoose, { Document, Schema, model } from 'mongoose';

export interface IUserBehaviorLog extends Document {
    userId: string; // References User firebaseUid
    actionType: 'SEARCH' | 'CLICK' | 'LIKE' | 'BOOK_INTENT';
    metadata: Record<string, any>;
    timestamp: Date;
}

const userBehaviorLogSchema = new Schema<IUserBehaviorLog>({
    userId: { type: String, required: true, index: true },
    actionType: { 
        type: String, 
        required: true, 
        enum: ['SEARCH', 'CLICK', 'LIKE', 'BOOK_INTENT'],
        index: true 
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true }
});

const UserBehaviorLog = model<IUserBehaviorLog>('UserBehaviorLog', userBehaviorLogSchema);
export default UserBehaviorLog;
