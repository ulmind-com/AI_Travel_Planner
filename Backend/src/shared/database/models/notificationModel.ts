import mongoose, { Schema, Document, model } from 'mongoose';

export enum NotificationType {
    LIKE_POST = 'like_post',
    LIKE_STORY = 'like_story',
    COMMENT_POST = 'comment_post',
    COMMENT_STORY = 'comment_story',
    FOLLOW = 'follow',
    MESSAGE = 'message',
    FRIEND_REQUEST = 'friend_request',
    FRIEND_ACCEPTED = 'friend_accepted',
    GROUP_INVITE = 'group_invite',
    ACCOUNT_BAN = 'account_ban',
}

export interface INotification extends Document {
    recipientFirebaseUid: string;
    senderFirebaseUid: string;
    type: NotificationType;
    relatedId?: string; // ID of post, story, or message
    isRead: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        recipientFirebaseUid: { type: String, required: true, index: true },
        senderFirebaseUid: { type: String, required: true },
        type: { type: String, enum: Object.values(NotificationType), required: true },
        relatedId: { type: String },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Notification = model<INotification>('Notification', notificationSchema);
export default Notification;
