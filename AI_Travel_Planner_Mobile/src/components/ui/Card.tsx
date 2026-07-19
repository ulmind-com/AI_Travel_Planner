import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, shadow } from '../../theme';

interface Props {
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  elevated?: boolean;
  rounded?: keyof typeof radius;
}

/** Solid surface card — the light-gray inspire cards from the reference. */
export function Card({
  children,
  onPress,
  style,
  padded = true,
  elevated = false,
  rounded = 'xl',
}: Props) {
  const body = (
    <View
      style={[
        styles.card,
        { borderRadius: radius[rounded] },
        elevated ? styles.elevated : shadow.sm,
        padded && styles.padded,
        style,
      ]}>
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
        {body}
      </Pressable>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: colors.white,
    ...shadow.card,
  },
  padded: { padding: 16 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
