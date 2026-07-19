import { Date, Document, Schema } from "mongoose";
import { IFlight } from "./FlightsDTO";
import { IHotel } from "./HotelsDTO";

/**
 * Interface for Travel Plans.
 * Extends Mongoose Document.
 * Contains user input fields and AI-generated trip details.
 */
export interface IPlan extends Document {
    userId: Schema.Types.ObjectId; // Reference to local User ID
    firebaseUid: string;           // Reference to Firebase User ID
    to: string;                    // Destination
    from: string;                  // Origin
    date: Date;                    // Travel Date
    travelers: number;
    budget: string;
    budget_range?: string;
    activities?: string[];
    travel_style?: string;
    location?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    startDate?: Date;
    endDate?: Date;

    // AI generated Content Fields
    // AI generated Content Fields
    ai_score: number; // Changed to number
    image_url: string;
    name: string;
    days: number;
    cost: number;
    star: number;
    total_reviews: number;
    destination_overview: string;
    perfect_for: string[];

    // Strict Budget Structure
    budget_breakdown: {
        flights: number;
        accommodation: number;
        activities: number;
        food: number;
        total: number;
        currency?: string;
    };

    trip_highlights: {
        name: string;
        description: string;
        match_reason: string;
        geo_coordinates: {
            lat: number;
            lng: number;
        };
    }[];

    // Strict Itinerary Structure
    suggested_itinerary: {
        day: number;
        morning: string;
        afternoon: string;
        evening: string;
        title?: string;
        description?: string;
        activities: {
            name: string;
            cost: string;
            time: string;
            description: string;
        }[];
    }[];

    how_to_reach?: {
        best_way: string;
        modes: {
            type: string;
            description: string;
            estimated_cost?: string;
            duration?: string;
        }[];
        arrival_tips: string[];
    };

    local_tips: string[];

    // Integrated Booking Data (References)
    hotels?: Schema.Types.ObjectId[]; // Ref to Hotel
    flights?: Schema.Types.ObjectId[]; // Ref to Flight

    // raw AI response data for processing
    hotel_options?: any[];
    flight_options?: any[];

    // Custom user items and files
    itineraryItems?: {
        id: string;
        day: number;
        time: string;
        type: 'flight' | 'hotel' | 'activity' | 'restaurant' | 'transport';
        title: string;
        description: string;
        location?: string;
        duration?: string;
        cost?: number;
        status: 'confirmed' | 'pending';
    }[];
    documents?: {
        id: string;
        name: string;
        type: string;
        category: string;
        uploadDate: string;
        expiryDate?: string;
        size: string;
        url: string;
        isPrivate?: boolean;
        notes?: string;
    }[];

    // Advanced Intelligence Analytics Fields
    views?: number;
    saves?: number;
    likesCount?: number;
    commentsCount?: number;
    status?: 'active' | 'trending' | 'inactive';
    isFlagged?: boolean;
    flagReason?: string;
}
