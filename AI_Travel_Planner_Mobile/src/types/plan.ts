/** Travel plan shapes returned by the backend AI planner. */

export interface BudgetBreakdown {
  flights?: number;
  accommodation?: number;
  activities?: number;
  food?: number;
  total?: number;
  currency?: string;
}

export interface TripHighlight {
  name: string;
  description?: string;
  match_reason?: string;
  geo_coordinates?: { lat: number; lng: number };
}

export interface ItineraryActivity {
  name: string;
  cost?: string;
  time?: string;
  description?: string;
}

export interface ItineraryDay {
  day: number;
  title?: string;
  description?: string;
  morning?: string;
  afternoon?: string;
  evening?: string;
  activities?: ItineraryActivity[];
}

export interface HowToReach {
  best_way?: string;
  modes?: {
    type: string;
    description?: string;
    estimated_cost?: string;
    duration?: string;
  }[];
  arrival_tips?: string[];
}

export interface Plan {
  _id?: string;
  firebaseUid?: string;
  to: string;
  from: string;
  date?: string;
  travelers?: number;
  budget?: number;
  budget_range?: string;
  activities?: string[];
  travel_style?: string;

  // AI-generated
  ai_score?: number;
  image_url?: string;
  name: string;
  days?: number;
  cost?: number;
  star?: number;
  total_reviews?: number;
  destination_overview?: string;
  perfect_for?: string[];
  budget_breakdown?: BudgetBreakdown;
  trip_highlights?: TripHighlight[];
  suggested_itinerary?: ItineraryDay[];
  how_to_reach?: HowToReach;
  local_tips?: string[];
  createdAt?: string;
}

/**
 * Request body for POST /plans/search/destination.
 * NOTE: `budget` is a NUMBER (the spend cap the Plan model stores), while
 * `budget_range` is the tier label ("budget" | "mid" | "luxury"), and
 * `duration` is a day count — this matches the web client + Plan schema.
 */
export interface PlanSearchInput {
  to: string;
  from: string;
  date: string;
  travelers: number;
  budget: number;
  budget_range?: 'budget' | 'mid' | 'luxury';
  activities?: string[];
  travel_style?: string;
  duration?: number;
}
