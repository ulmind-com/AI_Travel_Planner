/**
 * Curated fallback discovery content for the Home screen — used only until the
 * backend returns personalized recommendations. Icons are lucide names resolved
 * in HomeScreen (no emoji, so typography stays consistent across platforms).
 */
export type InspireIcon = 'castle' | 'balloon' | 'torii' | 'colosseum';

export const FEATURED = {
  from: 'CURATED FOR YOU',
  title: 'Dublin, Ireland',
  icon: 'castle' as InspireIcon,
  highlights: ['Effortless transport', 'Curated 3-day itinerary'],
  gradient: ['#3A9BF0', '#5FB0EF', '#8FCBF6'] as string[],
};

export const INSPIRE: {
  id: string;
  title: string;
  icon: InspireIcon;
  rating: string;
  highlights: string[];
  gradient: string[];
  tint: string;
}[] = [
  {
    id: 'paris',
    title: 'Paris, France',
    icon: 'balloon',
    rating: '4.9',
    highlights: ['World-famous museums', 'Historic Gothic cathedral'],
    gradient: ['#E8F3FE', '#CFEAFE'],
    tint: '#2F90EA',
  },
  {
    id: 'kyoto',
    title: 'Kyoto, Japan',
    icon: 'torii',
    rating: '4.8',
    highlights: ['Thousands of red torii', 'Zen Buddhist temples'],
    gradient: ['#FFE9EA', '#FFF3DC'],
    tint: '#FF5A5F',
  },
  {
    id: 'rome',
    title: 'Rome, Italy',
    icon: 'colosseum',
    rating: '4.9',
    highlights: ['Ancient Colosseum', 'World-class cuisine'],
    gradient: ['#ECE9FE', '#E4F1FB'],
    tint: '#7C6CF0',
  },
];
