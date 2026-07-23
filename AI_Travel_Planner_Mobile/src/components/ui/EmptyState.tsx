import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Gradient } from './Gradient';
import { AppText } from './AppText';
import { Button } from './Button';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';

interface Props {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Optional CTA */
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  /** Gradient used for the icon badge; defaults to a soft sky tint. */
  gradient?: readonly string[];
  compact?: boolean;
}

/** Consistent, premium empty / loading state used across list screens. */
export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon,
  loading,
  loadingLabel,
  gradient,
  compact,
}: Props) {
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <Gradient colors={gradient ?? [colors.sky200, colors.sky100]} style={styles.badge}>
        {loading ? <ActivityIndicator color={colors.brand} /> : icon}
      </Gradient>
      <AppText variant="h2" center style={styles.title}>
        {loading ? loadingLabel ?? 'Loading…' : title}
      </AppText>
      {!loading && subtitle ? (
        <AppText variant="body" muted center style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
      {!loading && actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} icon={actionIcon} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: spacing.huge, paddingHorizontal: spacing.xxl },
  compact: { paddingTop: spacing.xxxl },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  title: {},
  subtitle: { marginTop: spacing.sm, lineHeight: 22 },
  action: { marginTop: spacing.xl, width: '72%' },
});

export { radius };
