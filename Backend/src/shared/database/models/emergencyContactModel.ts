import { Schema, model, Document } from 'mongoose';

export interface IEmergencyContact extends Document {
    userId: Schema.Types.ObjectId;
    name: string;
    phone: string;
    relation: string;
    createdAt: Date;
    updatedAt: Date;
}

const emergencyContactSchema = new Schema<IEmergencyContact>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relation: { type: String, required: true }
}, { timestamps: true });

const EmergencyContact = model<IEmergencyContact>('EmergencyContact', emergencyContactSchema);
export default EmergencyContact;
