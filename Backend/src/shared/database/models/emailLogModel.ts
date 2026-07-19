import mongoose, { Document, Schema, model } from 'mongoose';

export interface IEmailLog extends Document {
    to: string;
    from: string;
    subject: string;
    html: string;
    status: 'delivered' | 'failed' | 'pending';
    category: 'Trip Notifications' | 'Group Updates' | 'Bookings' | 'Payments' | 'Security Alerts' | 'Marketing' | 'Direct';
    starred: boolean;
    isTrash: boolean;
    isImportant: boolean;
    opened: boolean;
    openedAt?: Date;
    sentAt: Date;
    attachments?: Array<{
        filename: string;
        contentType?: string;
        size?: number; // Size in bytes
    }>;
}

const emailLogSchema = new Schema<IEmailLog>(
    {
        to: { type: String, required: true, index: true },
        from: { type: String, required: true },
        subject: { type: String, required: true },
        html: { type: String, required: true },
        status: {
            type: String,
            enum: ['delivered', 'failed', 'pending'],
            default: 'delivered',
            index: true
        },
        category: {
            type: String,
            enum: ['Trip Notifications', 'Group Updates', 'Bookings', 'Payments', 'Security Alerts', 'Marketing', 'Direct'],
            default: 'Direct',
            index: true
        },
        starred: { type: Boolean, default: false },
        isTrash: { type: Boolean, default: false, index: true },
        isImportant: { type: Boolean, default: false, index: true },
        opened: { type: Boolean, default: false },
        openedAt: { type: Date },
        sentAt: { type: Date, default: Date.now, index: true },
        attachments: [
            {
                filename: { type: String },
                contentType: { type: String },
                size: { type: Number }
            }
        ]
    },
    { timestamps: true }
);

const EmailLog = model<IEmailLog>('EmailLog', emailLogSchema);
export default EmailLog;
