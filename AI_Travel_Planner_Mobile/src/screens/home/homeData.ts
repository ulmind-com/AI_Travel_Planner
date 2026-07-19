/**
 * Placeholder discovery content for the Home screen.
 * Replaced by live data from the backend recommendations / plans
 * endpoints once the API URL is wired post-deploy.
 */
export const FEATURED = {
  from: 'CURATED FOR YOU',
  title: 'Dublin, Ireland',
  emoji: '🏰',
  highlights: ['Effortless transport', 'Curated 3-day itinerary'],
  gradient: ['#3A9BF0', '#5FB0EF', '#8FCBF6'] as string[],
};

export const INSPIRE = [
  {
    id: 'paris',
    title: 'Paris, France',
    emoji: '🎈',
    rating: '4.9',
    highlights: ['World-famous museums', 'Historic Gothic cathedral'],
    gradient: ['#E8F3FE', '#CFEAFE'] as string[],
  },
  {
    id: 'kyoto',
    title: 'Kyoto, Japan',
    emoji: '⛩️',
    rating: '4.8',
    highlights: ['Thousands of red torii', 'Zen Buddhist temples'],
    gradient: ['#FFE9EA', '#FFF3DC'] as string[],
  },
  {
    id: 'rome',
    title: 'Rome, Italy',
    emoji: '🏛️',
    rating: '4.9',
    highlights: ['Ancient Colosseum', 'World-class cuisine'],
    gradient: ['#ECE9FE', '#E4F1FB'] as string[],
  },
];
