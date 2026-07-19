import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';

interface Props {
  children?: React.ReactNode;
  variant?: 'sky' | 'skyDeep' | 'plain';
  style?: ViewStyle;
}

/**
 * Dreamy sky-blue gradient backdrop from the reference. Soft floating
 * "cloud" blobs add the watercolor depth seen in the mockups.
 */
export function GradientBackground({ children, variant = 'sky', style }: Props) {
  if (variant === 'plain') {
    return <View style={[styles.plain, style]}>{children}</View>;
  }
  const gradient = variant === 'skyDeep' ? colors.skyGradientDeep : colors.skyGradient;
  return (
    <LinearGradient
      colors={[...gradient]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.fill, style]}>
      {/* soft cloud blobs */}
      <View pointerEvents="none" style={[styles.blob, styles.blobTop]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobBottom]} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  plain: { flex: 1, backgroundColor: colors.background },
  blob: {
    position: 'absolute',
    borderRadius: 400,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  blobTop: {
    width: 360,
    height: 360,
    top: -120,
    right: -100,
    opacity: 0.55,
  },
  blobBottom: {
    width: 420,
    height: 420,
    bottom: -160,
    left: -140,
    backgroundColor: 'rgba(191,228,251,0.45)',
    opacity: 0.6,
  },
});
