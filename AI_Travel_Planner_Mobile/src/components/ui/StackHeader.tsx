import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowLeft, X } from 'lucide-react-native';
import { AppText } from './AppText';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme';

interface Props {
  title: string;
  subtitle?: string;
  onBack: () => void;
  /** 'back' arrow (default) or 'close' X for modals. */
  backVariant?: 'back' | 'close';
  right?: React.ReactNode;
}

/** Consistent stack-screen header: circular back button, title, optional action. */
export function StackHeader({ title, subtitle, onBack, backVariant = 'back', right }: Props) {
  return (
    <View style={styles.header}>
      <Pressable style={styles.circle} onPress={onBack} hitSlop={10}>
        {backVariant === 'close' ? (
          <X size={20} color={colors.ink700} />
        ) : (
          <ArrowLeft size={22} color={colors.ink800} />
        )}
      </Pressable>
      <View style={styles.titleWrap}>
        <AppText variant="h3" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="label" muted numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.right}>{right ?? <View style={styles.circlePlaceholder} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlePlaceholder: { width: 42, height: 42 },
  titleWrap: { flex: 1 },
  right: { minWidth: 42, alignItems: 'flex-end' },
});
