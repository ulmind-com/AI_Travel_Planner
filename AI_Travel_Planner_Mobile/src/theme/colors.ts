/**
 * Color system — distilled from the reference UI:
 * soft sky-blue gradients, white glass cards, ink typography,
 * playful accent chips and warm gold ratings.
 */

export const palette = {
  // Sky / brand gradient (dreamy watercolor blue from the reference)
  sky050: '#F4FAFF',
  sky100: '#E4F3FF',
  sky200: '#CFEAFE',
  sky300: '#AFDBFB',
  sky400: '#8FCBF6',
  sky500: '#5FB0EF',

  // Signature brand blue (buttons, active states, links)
  brand: '#2F90EA',
  brandDark: '#1F73C4',
  brandSoft: '#E8F3FE',

  // Ink (typography + high-contrast CTAs)
  ink900: '#14161C',
  ink800: '#1F232B',
  ink700: '#363B45',
  ink600: '#4C525C',
  ink500: '#6B717C',
  ink400: '#9098A3',
  ink300: '#B9C0CA',

  // Neutral surfaces
  white: '#FFFFFF',
  surface: '#F5F6F8', // light gray card (reference inspire cards)
  surfaceAlt: '#FBFCFD',
  border: '#ECEEF1',
  borderStrong: '#E1E4E9',

  // Playful accents (category chips)
  green: '#2FBF71', // flights / timeline
  greenSoft: '#E4F7ED',
  coral: '#FF5A5F', // hotels
  coralSoft: '#FFE9EA',
  blueChip: '#3B9AE1', // transport / cars
  blueChipSoft: '#E4F1FB',
  purple: '#7C6CF0', // experiences / translate
  purpleSoft: '#ECE9FE',

  // Ratings / warmth
  gold: '#FFB020',
  goldSoft: '#FFF3DC',

  // Feedback
  danger: '#E5484D',
  dangerSoft: '#FDE9E9',
  success: '#2FBF71',
} as const;

export const colors = {
  ...palette,

  // Semantic aliases
  background: palette.white,
  card: palette.surface,
  cardElevated: palette.white,
  textPrimary: palette.ink900,
  textSecondary: palette.ink500,
  textMuted: palette.ink400,
  primary: palette.brand,
  onPrimary: palette.white,

  // Gradients (arrays consumed by LinearGradient)
  skyGradient: [palette.sky200, palette.sky100, palette.sky050],
  skyGradientDeep: ['#BFE4FB', '#D9F0FF', '#F1F9FF'],
  brandGradient: ['#3A9BF0', '#2F90EA', '#1F73C4'],
  glassOverlay: ['rgba(255,255,255,0.65)', 'rgba(255,255,255,0.25)'],
} as const;

export type ColorName = keyof typeof colors;
