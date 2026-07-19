import mongoose, { Schema, Document, model } from 'mongoose';

export interface IMessage extends Document {
    conversationId: mongoose.Types.ObjectId;
    senderFirebaseUid: string;
    content: string; // plaintext or base64 ciphertext (when isEncrypted=true)
    nonce?: string; // base64 nonce for E2EE decryption
    isEncrypted?: boolean; // whether content is E2EE encrypted
    type: 'text' | 'image' | 'file';
    status: 'sent' | 'delivered' | 'seen';
    seenBy: string[]; // firebaseUids
    createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
        senderFirebaseUid: { type: String, required: true, index: true },
        content: { type: String, required: true },
        nonce: { type: String, default: '' },
        isEncrypted: { type: Boolean, default: false },
        type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
        status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
        seenBy: [{ type: String }],
    },
    { timestamps: true }
);

const Message = model<IMessage>('Message', messageSchema);
export default Message;
