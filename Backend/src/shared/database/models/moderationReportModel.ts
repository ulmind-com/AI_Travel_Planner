import mongoose, { Schema, Document, model } from 'mongoose';

export enum ModerationType {
    POST = 'post',
    COMMENT = 'comment',
    USER = 'user',
    REVIEW = 'review'
}

export enum ModerationSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

export interface IModerationReport extends Document {
    type: ModerationType;
    entityId: string;
    reason: string;
    severity: ModerationSeverity;
    aiScore: number;
    flaggedContent: string;
    details?: string;
    status: 'pending' | 'resolved_deleted' | 'resolved_approved';
    createdAt: Date;
    updatedAt: Date;
}

const moderationReportSchema = new Schema<IModerationReport>(
    {
        type: { type: String, enum: Object.values(ModerationType), required: true, index: true },
        entityId: { type: String, required: true, index: true },
        reason: { type: String, required: true },
        severity: { type: String, enum: Object.values(ModerationSeverity), required: true, index: true },
        aiScore: { type: Number, required: true },
        flaggedContent: { type: String, required: true },
        details: { type: String },
        status: { type: String, enum: ['pending', 'resolved_deleted', 'resolved_approved'], default: 'pending', index: true }
    },
    { timestamps: true }
);

// Optimize compound sorting by type and severity
moderationReportSchema.index({ type: 1, severity: 1, createdAt: -1 });

const ModerationReport = model<IModerationReport>('ModerationReport', moderationReportSchema);
export default ModerationReport;
