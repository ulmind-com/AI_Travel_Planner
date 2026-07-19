import { Schema, model, Document } from 'mongoose';

export interface ISafetyAlert extends Document {
    location: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    type: 'crime' | 'weather' | 'crowd' | 'general';
    severity: 'low' | 'medium' | 'high';
    message: string;
    createdAt: Date;
}

const safetyAlertSchema = new Schema<ISafetyAlert>({
    location: { type: String, required: true },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number }
    },
    type: { type: String, enum: ['crime', 'weather', 'crowd', 'general'], required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    message: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Add geo-spatial index if we do geo-queries
safetyAlertSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

const SafetyAlert = model<ISafetyAlert>('SafetyAlert', safetyAlertSchema);
export default SafetyAlert;
