import { ViewStyle } from 'react-native';
import { colors } from './colors';
import { fonts, type, systemFallback } from './typography';

/** 4pt spacing scale */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

/** Rounded corners — the reference leans on soft, generous radii */
export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  xxl: 32,
  pill: 999,
} as const;

/** Soft, diffuse shadows for the glass/card look */
export const shadow: Record<'sm' | 'md' | 'lg' | 'card' | 'floating', ViewStyle> = {
  sm: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  card: {
    shadowColor: '#243B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 5,
  },
  floating: {
    shadowColor: '#0F2A5B',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 12,
  },
};

export const theme = {
  colors,
  fonts,
  type,
  spacing,
  radius,
  shadow,
  systemFallback,
} as const;

export { colors, fonts, type, systemFallback };
export type Theme = typeof theme;
