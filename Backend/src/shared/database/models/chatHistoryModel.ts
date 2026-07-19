import { Schema, model, Document } from 'mongoose';

export interface IChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    intent?: any;
    action?: any;
}

export interface IChatHistory extends Document {
    userId: Schema.Types.ObjectId;
    firebaseUid: string;
    messages: IChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    intent: { type: Schema.Types.Mixed },
    action: { type: Schema.Types.Mixed }
});

const chatHistorySchema = new Schema<IChatHistory>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    firebaseUid: {
        type: String,
        required: true,
        index: true
    },
    messages: [chatMessageSchema]
}, { timestamps: true });

const ChatHistory = model<IChatHistory>('ChatHistory', chatHistorySchema);
export default ChatHistory;
