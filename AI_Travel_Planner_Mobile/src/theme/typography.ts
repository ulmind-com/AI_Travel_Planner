/**
 * Typography — Outfit (rounded geometric, for headings/UI) + Inter (body).
 * Font files are bundled in src/assets/fonts and linked via react-native.config.js.
 * If a family fails to load on a platform, RN falls back to the system font gracefully.
 */
import { Platform, TextStyle } from 'react-native';

export const fonts = {
  // Outfit family (display / headings / buttons)
  display: 'Outfit-Bold',
  displaySemi: 'Outfit-SemiBold',
  heading: 'Outfit-SemiBold',
  medium: 'Outfit-Medium',
  // Inter family (body / labels)
  body: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bodySemi: 'Inter-SemiBold',
} as const;

type Variant =
  | 'hero'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label'
  | 'button';

export const type: Record<Variant, TextStyle> = {
  hero: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },
  h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  h2: { fontFamily: fonts.displaySemi, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  title: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  button: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 20, letterSpacing: 0.1 },
};

// System fallback used before/if custom fonts are unavailable.
export const systemFallback = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});
