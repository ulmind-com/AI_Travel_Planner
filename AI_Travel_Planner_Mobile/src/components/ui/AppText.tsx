import React from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { type as typeScale } from '../../theme/typography';

type Variant = keyof typeof typeScale;

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  center?: boolean;
  muted?: boolean;
}

/** Typed Text component that applies the app's type scale + font families. */
export function AppText({
  variant = 'body',
  color,
  center,
  muted,
  style,
  children,
  ...rest
}: AppTextProps) {
  const resolved: TextStyle = {
    ...typeScale[variant],
    color: color ?? (muted ? colors.textSecondary : colors.textPrimary),
    ...(center ? styles.center : null),
  };
  return (
    <Text style={[resolved, style]} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
