/**
 * Hotel Redirect Engine (React Native port of the website's engine).
 *
 * Builds real search URLs for external booking platforms (Airbnb,
 * Booking.com, Agoda, Hotels.com, Hostelworld) from a destination
 * string + optional dates/guests. All user input is sanitized and
 * URL-encoded before insertion.
 */

export interface HotelLocation {
  city: string;
  country: string;
  full: string;
}

export interface HotelParams {
  checkin?: string; // YYYY-MM-DD
  checkout?: string; // YYYY-MM-DD
  adults?: number;
}

const sanitizeLocation = (input?: string): string => {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>{}|\\^`[\]]/g, '')
    .replace(/["']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
};

/** Split a raw destination ("Kyoto, Japan") into city/country/full. */
export const extractLocation = (raw?: string): HotelLocation => {
  const clean = sanitizeLocation(raw);
  if (!clean) return { city: '', country: '', full: '' };

  const parts = clean.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { city: parts[0], country: parts[parts.length - 1], full: clean };
  }
  return { city: parts[0] || clean, country: '', full: clean };
};

export interface HotelProvider {
  id: string;
  name: string;
  emoji: string;
  tint: string;
  buildUrl: (location: HotelLocation, params?: HotelParams) => string;
}

export const HOTEL_PROVIDERS: HotelProvider[] = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    emoji: '🏠',
    tint: '#FF5A5F',
    buildUrl: (location, params = {}) => {
      const { city, country } = location;
      let slug = city;
      if (country) slug += `--${country}`;
      slug = slug.replace(/\s+/g, '-');
      let url = `https://www.airbnb.com/s/${encodeURIComponent(slug)}/homes`;
      const q: string[] = [];
      if (params.checkin) q.push(`checkin=${params.checkin}`);
      if (params.checkout) q.push(`checkout=${params.checkout}`);
      if (params.adults) q.push(`adults=${params.adults}`);
      q.push('ref=adventurenexus');
      if (q.length) url += `?${q.join('&')}`;
      return url;
    },
  },
  {
    id: 'booking',
    name: 'Booking.com',
    emoji: '🏨',
    tint: '#2F73C4',
    buildUrl: (location, params = {}) => {
      const q = [`ss=${encodeURIComponent(location.full || location.city)}`, 'ref=adventurenexus'];
      if (params.checkin) q.push(`checkin=${params.checkin}`);
      if (params.checkout) q.push(`checkout=${params.checkout}`);
      if (params.adults) q.push(`group_adults=${params.adults}`);
      return `https://www.booking.com/searchresults.html?${q.join('&')}`;
    },
  },
  {
    id: 'agoda',
    name: 'Agoda',
    emoji: '🌏',
    tint: '#E5484D',
    buildUrl: (location, params = {}) => {
      const q = [`textToSearch=${encodeURIComponent(location.full || location.city)}`, 'ref=adventurenexus'];
      if (params.checkin) q.push(`checkIn=${params.checkin}`);
      if (params.checkout) q.push(`checkOut=${params.checkout}`);
      return `https://www.agoda.com/search?${q.join('&')}`;
    },
  },
  {
    id: 'hotels',
    name: 'Hotels.com',
    emoji: '⭐',
    tint: '#C81E2C',
    buildUrl: (location, params = {}) => {
      const q = [`q-destination=${encodeURIComponent(location.full || location.city)}`, 'ref=adventurenexus'];
      if (params.checkin) q.push(`q-check-in=${params.checkin}`);
      if (params.checkout) q.push(`q-check-out=${params.checkout}`);
      return `https://www.hotels.com/search.do?${q.join('&')}`;
    },
  },
  {
    id: 'hostelworld',
    name: 'Hostelworld',
    emoji: '🎒',
    tint: '#F5A623',
    buildUrl: (location, params = {}) => {
      let url = `https://www.hostelworld.com/s?q=${encodeURIComponent(location.full || location.city)}`;
      url += '&ref=adventurenexus';
      if (params.checkin) url += `&DateStart=${params.checkin}`;
      if (params.checkout) url += `&DateEnd=${params.checkout}`;
      return url;
    },
  },
];
