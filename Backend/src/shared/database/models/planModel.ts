import { Schema, model } from 'mongoose'; // Mongoose ODM
import { IPlan } from '../DTOs/PlansDTO'; // Plan Interface/DTO

/**
 * Plan Schema definition.
 * Stores all details related to a user's generated travel plan.
 */
const planSchema = new Schema<IPlan>({
    // Relationship with User Model
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    // Reference to Firebase User ID for quick lookups
    firebaseUid: {
        type: String,
        required: true,
        index: true,
    },
    // Core Trip Details
    to: { type: String, required: true }, // Destination
    from: { type: String, required: true }, // Origin
    date: { type: Date, required: true }, // Travel Date
    travelers: { type: Number, required: true }, // Pax count
    budget: { type: Number, required: true }, // Budget limit
    budget_range: String, // e.g. "Low", "Medium", "High"
    activities: [String], // User preferences for activities
    travel_style: String, // e.g. "Relaxed", "Adventure"
    location: String,
    coordinates: {
        lat: Number,
        lng: Number
    },
    startDate: Date,
    endDate: Date,

    // AI-Generated Rich Content
    ai_score: { type: Number, index: true }, // Changed from String to Number for sorting
    image_url: String,
    name: String,
    days: Number,
    cost: Number,
    star: Number,
    total_reviews: Number,
    destination_overview: String,
    perfect_for: [String],

    // Structured Budget
    budget_breakdown: {
        flights: Number,
        accommodation: Number,
        activities: Number,
        food: Number,
        total: Number,
        currency: { type: String, default: 'USD' }
    },

    // Structured Itinerary
    suggested_itinerary: [{
        day: Number,
        morning: String,
        afternoon: String,
        evening: String,
        title: String,
        description: String,
        activities: [{
            name: String,
            cost: String,
            time: String,
            description: String
        }]
    }],

    trip_highlights: [{
        name: String,
        description: String,
        match_reason: String,
        geo_coordinates: {
            lat: Number,
            lng: Number
        }
    }],
    how_to_reach: {
        best_way: String,
        modes: [{
            type: { type: String },
            description: String,
            estimated_cost: String,
            duration: String
        }],
        arrival_tips: [String]
    },
    local_tips: [String],
    hotels: [{ type: Schema.Types.ObjectId, ref: 'Hotel' }],
    flights: [{ type: Schema.Types.ObjectId, ref: 'Flight' }],

    // Custom user items and files
    itineraryItems: [{
        id: { type: String, required: true },
        day: { type: Number, required: true },
        time: { type: String, required: true },
        type: { type: String, enum: ['flight', 'hotel', 'activity', 'restaurant', 'transport'], required: true },
        title: { type: String, required: true },
        description: { type: String },
        location: { type: String },
        duration: { type: String },
        cost: { type: Number },
        status: { type: String, enum: ['confirmed', 'pending'], default: 'confirmed' }
    }],
    documents: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
        category: { type: String, required: true },
        uploadDate: { type: String, required: true },
        expiryDate: { type: String },
        size: { type: String, required: true },
        url: { type: String, required: true },
        isPrivate: { type: Boolean, default: false },
        notes: { type: String }
    }],

    // Advanced Intelligence Analytics Fields
    views: { type: Number, default: 120 },
    saves: { type: Number, default: 24 },
    likesCount: { type: Number, default: 18 },
    commentsCount: { type: Number, default: 5 },
    status: { type: String, enum: ['active', 'trending', 'inactive'], default: 'active', index: true },
    isFlagged: { type: Boolean, default: false, index: true },
    flagReason: { type: String, default: '' },
}, { timestamps: true });


const Plan = model<IPlan>('Plan', planSchema);
export default Plan;
