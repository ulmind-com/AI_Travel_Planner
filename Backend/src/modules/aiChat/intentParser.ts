export interface IParsedIntent {
    intent: 'general_chat' | 'budget_travel' | 'luxury_travel' | 'adventure' | 'relaxation' | 'family_trip' | 'solo_trip';
    budget: 'low' | 'medium' | 'high' | 'unknown';
    destination: string | null;
    mood: string;
    groupType: 'solo' | 'group' | 'family' | 'unknown';
}

/**
 * Local fast heuristic intent parser to extract initial signals from user message.
 */
export const parseIntentHeuristic = (message: string): IParsedIntent => {
    const text = message.toLowerCase();
    
    let intent: IParsedIntent['intent'] = 'general_chat';
    let budget: IParsedIntent['budget'] = 'unknown';
    let destination: string | null = null;
    let groupType: IParsedIntent['groupType'] = 'unknown';
    let mood = 'neutral';

    // Heuristics for Budget
    if (text.includes('cheap') || text.includes('budget') || text.includes('sasta') || text.includes('low cost') || text.includes('khoroch kom') || text.includes('cheap price')) {
        budget = 'low';
        mood = 'cost_sensitive';
        intent = 'budget_travel';
    } else if (text.includes('luxury') || text.includes('expensive') || text.includes('premium') || text.includes('5 star') || text.includes('rich') || text.includes('high budget')) {
        budget = 'high';
        mood = 'premium_seeking';
        intent = 'luxury_travel';
    } else if (text.includes('moderate') || text.includes('medium') || text.includes('standard')) {
        budget = 'medium';
    }

    // Heuristics for Group Type
    if (text.includes('solo') || text.includes('akela') || text.includes('myself') || text.includes('alone')) {
        groupType = 'solo';
    } else if (text.includes('group') || text.includes('friends') || text.includes('dost') || text.includes('team') || text.includes('gang')) {
        groupType = 'group';
    } else if (text.includes('family') || text.includes('parents') || text.includes('bachhe') || text.includes('wife') || text.includes('paribar')) {
        groupType = 'family';
    }

    // Heuristics for Destination (simple capture)
    // Match common capitalization pattern or after "to", "in", "visit", "explore"
    const destMatch = message.match(/(?:to|in|visit|explore|for)\s+([A-Z][a-zA-Z\s]{2,15})/);
    if (destMatch && destMatch[1]) {
        destination = destMatch[1].trim();
    }

    // Specific destination keyword checks
    const destinationsList = [
        'Japan', 'Thailand', 'Bali', 'Singapore', 'Malaysia', 'Switzerland', 'India', 'Sikkim', 
        'Kerala', 'Goa', 'Ladakh', 'Europe', 'Paris', 'London', 'Dubai', 'Vietnam'
    ];
    for (const dest of destinationsList) {
        if (text.includes(dest.toLowerCase())) {
            destination = dest;
            break;
        }
    }

    // Heuristics for Travel Style
    if (text.includes('trek') || text.includes('hike') || text.includes('adventure') || text.includes('climb') || text.includes('mountains')) {
        intent = 'adventure';
        mood = 'thrill_seeking';
    } else if (text.includes('relax') || text.includes('beach') || text.includes('chill') || text.includes('peaceful') || text.includes('spa')) {
        intent = 'relaxation';
        mood = 'leisurely';
    }

    return {
        intent,
        budget,
        destination,
        mood,
        groupType
    };
};
