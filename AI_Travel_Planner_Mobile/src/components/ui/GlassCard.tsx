import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { radius, shadow } from '../../theme';

interface Props {
  children?: React.ReactNode;
  style?: ViewStyle;
  rounded?: keyof typeof radius;
  padded?: boolean;
}

/**
 * Frosted-glass card — the signature translucent surface from the reference.
 * Implemented with layered translucent fills (no native blur module) so it
 * builds cleanly on both Android and iOS new architecture.
 */
export function GlassCard({ children, style, rounded = 'xl', padded = true }: Props) {
  const borderRadius = radius[rounded];
  return (
    <View style={[styles.wrap, { borderRadius }, shadow.card, style]}>
      <View style={styles.sheen} />
      <View style={[styles.content, padded && styles.padded]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.65)',
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  content: {},
  padded: { padding: 16 },
});
