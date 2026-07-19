import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Gradient as LinearGradient } from './ui/Gradient';
import { CalendarDays, MapPin, Sparkles, Star } from 'lucide-react-native';
import { AppText } from './ui/AppText';
import { colors } from '../theme/colors';
import { radius, shadow, spacing } from '../theme';
import type { Plan } from '../types/plan';

const FALLBACK =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1000&auto=format&fit=crop';

function formatCost(plan: Plan): string | null {
  const total = plan.budget_breakdown?.total ?? plan.cost;
  if (!total) return null;
  const cur = plan.budget_breakdown?.currency || '$';
  const symbol = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : cur === 'INR' ? '₹' : cur;
  return `${symbol}${Math.round(Number(total)).toLocaleString()}`;
}

export function PlanCard({ plan, onPress }: { plan: Plan; onPress?: () => void }) {
  const cost = formatCost(plan);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: plan.image_url || FALLBACK }}
          style={styles.image}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(10,16,30,0.55)']}
          style={styles.imageShade}
        />
        {typeof plan.ai_score === 'number' && plan.ai_score > 0 ? (
          <View style={styles.aiBadge}>
            <Sparkles size={12} color={colors.white} />
            <AppText variant="label" color={colors.white}>
              {Math.round(plan.ai_score)}% match
            </AppText>
          </View>
        ) : null}
        <View style={styles.imageMeta}>
          <View style={styles.locRow}>
            <MapPin size={14} color={colors.white} />
            <AppText variant="bodyStrong" color={colors.white} numberOfLines={1}>
              {plan.name || plan.to}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          {plan.days ? (
            <View style={styles.metaItem}>
              <CalendarDays size={14} color={colors.ink500} />
              <AppText variant="caption" muted>
                {plan.days} days
              </AppText>
            </View>
          ) : null}
          {typeof plan.star === 'number' && plan.star > 0 ? (
            <View style={styles.metaItem}>
              <Star size={14} color={colors.gold} fill={colors.gold} />
              <AppText variant="caption" muted>
                {plan.star.toFixed(1)}
                {plan.total_reviews ? ` (${plan.total_reviews})` : ''}
              </AppText>
            </View>
          ) : null}
          {cost ? (
            <View style={styles.costPill}>
              <AppText variant="label" color={colors.brandDark}>
                {cost}
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
                <AppText variant="label" color={colors.ink600}>
                  {t}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
  imageWrap: { height: 170, backgroundColor: colors.surface },
  image: { width: '100%', height: '100%' },
  imageShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
  aiBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(47,144,234,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  imageMeta: { position: 'absolute', left: 14, right: 14, bottom: 12 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  body: { padding: spacing.lg },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  costPill: {
    marginLeft: 'auto',
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  overview: { marginTop: spacing.md, lineHeight: 19 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  tag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
});
