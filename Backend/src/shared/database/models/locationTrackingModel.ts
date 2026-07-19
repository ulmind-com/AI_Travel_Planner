import { Schema, model, Document } from 'mongoose';

export interface ILocationTracking extends Document {
    userId: Schema.Types.ObjectId;
    lat: number;
    lng: number;
    timestamp: Date;
    isActiveSharing: boolean;
}

const locationTrackingSchema = new Schema<ILocationTracking>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    isActiveSharing: { type: Boolean, default: false }
}, { timestamps: { createdAt: false, updatedAt: true } });

const LocationTracking = model<ILocationTracking>('LocationTracking', locationTrackingSchema);
export default LocationTracking;
