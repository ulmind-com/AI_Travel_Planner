import { Schema, model, Document } from 'mongoose';

export interface IContentModerationLog extends Document {
    contentId: string; // ID of post, comment, or review
    type: 'POST' | 'COMMENT' | 'REVIEW';
    contentSnippet?: string;
    authorId: string; // User's Firebase UID or Mongo ID
    aiScore: number;
    flags: ('toxic' | 'spam' | 'sexual' | 'hate')[];
    status: 'pending' | 'approved' | 'flagged' | 'deleted';
    createdAt: Date;
}

const contentModerationLogSchema = new Schema<IContentModerationLog>({
    contentId: { type: String, required: true, index: true },
    type: { type: String, enum: ['POST', 'COMMENT', 'REVIEW'], required: true },
    contentSnippet: { type: String },
    authorId: { type: String, required: true, index: true },
    aiScore: { type: Number, default: 0, min: 0, max: 1 },
    flags: [{ type: String, enum: ['toxic', 'spam', 'sexual', 'hate'] }],
    status: { type: String, enum: ['pending', 'approved', 'flagged', 'deleted'], default: 'pending', index: true },
    createdAt: { type: Date, default: Date.now }
});

const ContentModerationLog = model<IContentModerationLog>('ContentModerationLog', contentModerationLogSchema);
export default ContentModerationLog;
