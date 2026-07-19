import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, shadow } from '../../theme';
import { AppText } from './AppText';

interface ChipProps {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

/** Pill chip like the reference "Timeline / Distance / Budget" selectors. */
export function Chip({ label, icon, active, onPress, style }: ChipProps) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.active, style]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <AppText variant="bodyStrong" color={active ? colors.ink900 : colors.ink600}>
        {label}
      </AppText>
    </Pressable>
  );
}

interface IconTileProps {
  icon: React.ReactNode;
  bg: string;
  onPress?: () => void;
  size?: number;
}

/** Rounded colored icon tile (flights/hotels/cars/experiences row). */
export function IconTile({ icon, bg, onPress, size = 52 }: IconTileProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tile, { width: size, height: size, backgroundColor: bg }]}>
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  active: {
    borderColor: colors.borderStrong,
    ...shadow.sm,
  },
  icon: {},
  tile: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
});
