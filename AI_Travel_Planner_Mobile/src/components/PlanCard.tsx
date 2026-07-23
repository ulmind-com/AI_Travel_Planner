import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { CalendarDays, MapPin, Sparkles, Star, Users } from 'lucide-react-native';
import { Gradient } from './ui/Gradient';
import { SmartImage } from './ui/SmartImage';
import { AppText } from './ui/AppText';
import { colors } from '../theme/colors';
import { radius, shadow, spacing } from '../theme';
import { cleanTitle } from '../lib/text';
import type { Plan } from '../types/plan';

function currencySymbol(c?: string) {
  return c === 'EUR' ? '€' : c === 'INR' ? '₹' : c === 'GBP' ? '£' : '$';
}

function formatCost(plan: Plan): string | null {
  const total = plan.budget_breakdown?.total ?? plan.cost;
  if (!total) return null;
  const sym = currencySymbol(plan.budget_breakdown?.currency);
  const n = Math.round(Number(total));
  return n >= 1000 ? `${sym}${Math.round(n / 1000)}k` : `${sym}${n}`;
}

export function PlanCard({ plan, onPress }: { plan: Plan; onPress?: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const cost = formatCost(plan);
  const title = cleanTitle(plan.name || plan.to);

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={styles.card}>
        {/* Image */}
        <View style={styles.imageWrap}>
          <SmartImage uri={plan.image_url} seed={title} style={StyleSheet.absoluteFill} />
          <Gradient
            colors={['rgba(8,14,28,0.18)', 'rgba(8,14,28,0.02)', 'rgba(8,14,28,0.82)']}
            style={StyleSheet.absoluteFill}
          />

          {typeof plan.ai_score === 'number' && plan.ai_score > 0 ? (
            <Gradient colors={colors.brandGradient} style={styles.aiBadge}>
              <Sparkles size={11} color={colors.white} />
              <AppText variant="label" color={colors.white}>
                {Math.round(plan.ai_score)}% match
              </AppText>
            </Gradient>
          ) : null}

          {cost ? (
            <View style={styles.costBadge}>
              <AppText variant="bodyStrong" color={colors.ink900}>
                {cost}
              </AppText>
            </View>
          ) : null}

          <View style={styles.imageFoot}>
            <AppText variant="h2" color={colors.white} numberOfLines={1}>
              {title}
            </AppText>
            <View style={styles.locRow}>
              <MapPin size={13} color="rgba(255,255,255,0.9)" />
              <AppText variant="caption" color="rgba(255,255,255,0.9)" numberOfLines={1}>
                from {plan.from}
              </AppText>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <View style={styles.pills}>
            {plan.days ? (
              <View style={styles.pill}>
                <CalendarDays size={13} color={colors.brand} />
                <AppText variant="label" color={colors.ink700}>
                  {plan.days} days
                </AppText>
              </View>
            ) : null}
            {plan.travelers ? (
              <View style={styles.pill}>
                <Users size={13} color={colors.green} />
                <AppText variant="label" color={colors.ink700}>
                  {plan.travelers}
                </AppText>
              </View>
            ) : null}
            {typeof plan.star === 'number' && plan.star > 0 ? (
              <View style={styles.pill}>
                <Star size={13} color={colors.gold} fill={colors.gold} />
                <AppText variant="label" color={colors.ink700}>
                  {plan.star.toFixed(1)}
                </AppText>
              </View>
            ) : null}
          </View>

          {plan.destination_overview ? (
            <AppText variant="caption" muted numberOfLines={2} style={styles.overview}>
              {plan.destination_overview}
            </AppText>
          ) : null}

          {plan.perfect_for && plan.perfect_for.length > 0 ? (
            <View style={styles.tags}>
              {plan.perfect_for.slice(0, 3).map(t => (
                <View key={t} style={styles.tag}>
                  <AppText variant="label" color={colors.brandDark} numberOfLines={1}>
                    {t}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadow.card,
  },
  imageWrap: { height: 210, backgroundColor: colors.surface },
  image: { width: '100%', height: '100%' },
  aiBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  costBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    ...shadow.sm,
  },
  imageFoot: { position: 'absolute', left: 16, right: 16, bottom: 14 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  body: { padding: spacing.lg },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  overview: { marginTop: spacing.md, lineHeight: 19 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  tag: {
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    maxWidth: '48%',
  },
});
