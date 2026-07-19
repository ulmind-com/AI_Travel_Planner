/**
 * ═══════════════════════════════════════════════════════════════
 * AdventureNexus Hotel Redirect Engine
 * ═══════════════════════════════════════════════════════════════
 *
 * Dynamically generates URLs for external booking platforms
 * (Airbnb, Booking.com, Agoda, Hostelworld, Hotels.com)
 * based on a plan's destination, dates, and guest count.
 *
 * SECURITY:
 *   - All user-provided strings are sanitized before URL insertion.
 *   - encodeURIComponent prevents URL injection attacks.
 *
 * DESIGN DECISIONS:
 *   - Location is extracted from the plan's `to` field (destination)
 *     or `name` field (AI-generated plan title) as a fallback.
 *   - The `to` field is preferred because it's the raw user query
 *     (e.g., "Kyoto, Japan") while `name` can contain plan titles
 *     (e.g., "The Ultimate 7-Day Kyoto Temple Trail").
 *   - For Airbnb, we format "City, Country" → "City--Country"
 *     per Airbnb's URL convention.
 */

// ──────────────────────────────────────
// SANITIZATION
// ──────────────────────────────────────

/**
 * Sanitize a location string for safe URL embedding.
 * Strips dangerous characters, trims whitespace, and limits length.
 *
 * @param {string} input - Raw location string
 * @returns {string} Sanitized string
 */
const sanitizeLocation = (input) => {
    if (!input || typeof input !== 'string') return '';

    return input
        .replace(/[<>{}|\\^`[\]]/g, '')   // Strip dangerous URL chars
        .replace(/["']/g, '')              // Strip quotes
        .replace(/\s+/g, ' ')             // Normalize whitespace
        .trim()
        .slice(0, 200);                    // Prevent absurdly long input
};

// ──────────────────────────────────────
// LOCATION EXTRACTION
// ──────────────────────────────────────

/**
 * Extract a clean location string from a plan result.
 *
 * Priority:
 *  1. plan.to (raw destination query, e.g., "Kyoto, Japan")
 *  2. plan.name (AI plan title — may contain descriptive text)
 *  3. Fallback empty string
 *
 * @param {Object} plan - Search result plan object
 * @returns {{ city: string, country: string, full: string }}
 */
export const extractLocation = (plan) => {
    if (!plan) return { city: '', country: '', full: '' };

    // Use `to` field first (cleanest user-specified destination)
    const raw = sanitizeLocation(plan.to || plan.name || '');

    if (!raw) return { city: '', country: '', full: '' };

    // Try splitting by comma: "Tokyo, Japan" → ["Tokyo", "Japan"]
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);

    if (parts.length >= 2) {
        return {
            city: parts[0],
            country: parts[parts.length - 1],
            full: raw
        };
    }

    // No comma — treat entire string as city
    return {
        city: parts[0] || raw,
        country: '',
        full: raw
    };
};

// ──────────────────────────────────────
// PROVIDER URL BUILDERS
// ──────────────────────────────────────

/**
 * Booking platform definitions with dynamic URL builders.
 * Each builder receives a location object and optional params.
 */
export const HOTEL_PROVIDERS = [
    {
        id: 'airbnb',
        name: 'Airbnb',
        emoji: '🏠',
        color: 'from-rose-500 to-pink-600',
        hoverColor: 'hover:bg-rose-500/10',
        textColor: 'text-rose-500',
        buildUrl: (location, params = {}) => {
            // Airbnb format: /s/{City--Country}/homes
            const { city, country } = location;
            let slug = city;
            if (country) slug += `--${country}`;
            slug = slug.replace(/\s+/g, '-');

            let url = `https://www.airbnb.com/s/${encodeURIComponent(slug)}/homes`;

            // Optional date params
            const queryParams = [];
            if (params.checkin) queryParams.push(`checkin=${params.checkin}`);
            if (params.checkout) queryParams.push(`checkout=${params.checkout}`);
            if (params.adults) queryParams.push(`adults=${params.adults}`);
            queryParams.push('ref=adventurenexus');

            if (queryParams.length) url += `?${queryParams.join('&')}`;
            return url;
        }
    },
    {
        id: 'booking',
        name: 'Booking.com',
        emoji: '🏨',
        color: 'from-blue-500 to-blue-700',
        hoverColor: 'hover:bg-blue-500/10',
        textColor: 'text-blue-500',
        buildUrl: (location, params = {}) => {
            const queryParams = [
                `ss=${encodeURIComponent(location.full || location.city)}`,
                'ref=adventurenexus'
            ];
            if (params.checkin) queryParams.push(`checkin=${params.checkin}`);
            if (params.checkout) queryParams.push(`checkout=${params.checkout}`);
            if (params.adults) queryParams.push(`group_adults=${params.adults}`);

            return `https://www.booking.com/searchresults.html?${queryParams.join('&')}`;
        }
    },
    {
        id: 'agoda',
        name: 'Agoda',
        emoji: '🌏',
        color: 'from-red-500 to-orange-500',
        hoverColor: 'hover:bg-red-500/10',
        textColor: 'text-red-500',
        buildUrl: (location, params = {}) => {
            const queryParams = [
                `textToSearch=${encodeURIComponent(location.full || location.city)}`,
                'ref=adventurenexus'
            ];
            if (params.checkin) queryParams.push(`checkIn=${params.checkin}`);
            if (params.checkout) queryParams.push(`checkOut=${params.checkout}`);

            return `https://www.agoda.com/search?${queryParams.join('&')}`;
        }
    },
    {
        id: 'hotels',
        name: 'Hotels.com',
        emoji: '⭐',
        color: 'from-red-600 to-red-800',
        hoverColor: 'hover:bg-red-600/10',
        textColor: 'text-red-600',
        buildUrl: (location, params = {}) => {
            const queryParams = [
                `q-destination=${encodeURIComponent(location.full || location.city)}`,
                'ref=adventurenexus'
            ];
            if (params.checkin) queryParams.push(`q-check-in=${params.checkin}`);
            if (params.checkout) queryParams.push(`q-check-out=${params.checkout}`);

            return `https://www.hotels.com/search.do?${queryParams.join('&')}`;
        }
    },
    {
        id: 'hostelworld',
        name: 'Hostelworld',
        emoji: '🎒',
        color: 'from-orange-500 to-amber-600',
        hoverColor: 'hover:bg-orange-500/10',
        textColor: 'text-orange-500',
        buildUrl: (location, params = {}) => {
            const citySlug = (location.city || location.full)
                .toLowerCase()
                .replace(/\s+/g, '-');

            let url = `https://www.hostelworld.com/s?q=${encodeURIComponent(location.full || location.city)}`;
            url += '&ref=adventurenexus';
            if (params.checkin) url += `&DateStart=${params.checkin}`;
            if (params.checkout) url += `&DateEnd=${params.checkout}`;

            return url;
        }
    }
];

// ──────────────────────────────────────
// MAIN REDIRECT FUNCTION
// ──────────────────────────────────────

/**
 * Open a hotel booking platform in a new tab for a given plan result.
 *
 * @param {Object} plan - The search result plan object
 * @param {string} providerId - Provider key ('airbnb' | 'booking' | 'agoda' | 'hotels' | 'hostelworld')
 * @param {Object} [dateParams] - Optional { checkin, checkout, adults }
 * @returns {boolean} true if URL was opened successfully
 */
export const openHotelSearch = (plan, providerId = 'booking', dateParams = {}) => {
    const location = extractLocation(plan);

    if (!location.city && !location.full) {
        console.warn('[HotelRedirect] No location found in plan:', plan);
        return false;
    }

    const provider = HOTEL_PROVIDERS.find(p => p.id === providerId);
    if (!provider) {
        console.warn('[HotelRedirect] Unknown provider:', providerId);
        return false;
    }

    const url = provider.buildUrl(location, dateParams);

    // Open in new tab with security attributes
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

    if (!newWindow) {
        // Popup blocked — fallback to navigation
        window.location.href = url;
    }

    return true;
};

/**
 * Get the booking URL without opening it (for previews / tooltips).
 *
 * @param {Object} plan
 * @param {string} providerId
 * @param {Object} dateParams
 * @returns {string|null}
 */
export const getHotelSearchUrl = (plan, providerId = 'booking', dateParams = {}) => {
    const location = extractLocation(plan);
    if (!location.city && !location.full) return null;

    const provider = HOTEL_PROVIDERS.find(p => p.id === providerId);
    if (!provider) return null;

    return provider.buildUrl(location, dateParams);
};
