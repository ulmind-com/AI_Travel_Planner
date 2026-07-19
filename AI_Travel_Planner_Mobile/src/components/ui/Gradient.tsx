import React from 'react';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';

type Props = Omit<LinearGradientProps, 'colors'> & { colors: readonly string[] };

/**
 * Thin wrapper over expo-linear-gradient that accepts a plain string[] of
 * colors (expo types require a 2+ tuple). Centralizes the cast so screens can
 * pass dynamic gradient arrays freely.
 */
export function Gradient({ colors, ...rest }: Props) {
  return <LinearGradient colors={colors as unknown as readonly [string, string, ...string[]]} {...rest} />;
}
