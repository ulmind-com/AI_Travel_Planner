import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme';
import { AppText } from './AppText';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

/** Selectable pill used across the planner form (single or multi select). */
export function SelectChip({ label, selected, onPress, icon, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected ? styles.selected : styles.idle, style]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <AppText variant="bodyStrong" color={selected ? colors.white : colors.ink700}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  idle: { backgroundColor: colors.surface, borderColor: 'transparent' },
  selected: { backgroundColor: colors.brand, borderColor: colors.brand },
  icon: {},
});
