import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Bus,
  CalendarDays,
  Lightbulb,
  MapPin,
  Sparkles,
  Star,
  Users,
  Wallet,
} from 'lucide-react-native';
import { AppText, Card } from '../../components/ui';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import { savePlan } from '../../services/plansService';
import { apiErrorMessage } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import type { MainStackScreenProps } from '../../navigation/types';
import type { BudgetBreakdown } from '../../types/plan';

const FALLBACK =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1000&auto=format&fit=crop';

const BUDGET_ROWS: { key: keyof BudgetBreakdown; label: string; color: string }[] = [
  { key: 'flights', label: 'Flights', color: colors.brand },
  { key: 'accommodation', label: 'Stay', color: colors.purple },
  { key: 'activities', label: 'Activities', color: colors.green },
  { key: 'food', label: 'Food', color: colors.coral },
];

export function PlanDetailScreen({ navigation, route }: MainStackScreenProps<'PlanDetail'>) {
  const { plan } = route.params;
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState('');

  const saveMut = useMutation({
    mutationFn: () => savePlan(plan._id as string),
    onSuccess: () => {
      setSaved(true);
      setMsg('Saved to your favorites');
      queryClient.invalidateQueries({ queryKey: ['my-plans'] });
    },
    onError: e => setMsg(apiErrorMessage(e)),
  });

  const bb = plan.budget_breakdown;
  const total = bb?.total ?? plan.cost ?? 0;
  const cur = bb?.currency === 'EUR' ? '€' : bb?.currency === 'INR' ? '₹' : '$';

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: plan.image_url || FALLBACK }} style={styles.heroImg} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(10,16,30,0.35)', 'transparent', 'rgba(10,16,30,0.75)']}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={['top']} style={styles.heroBar}>
            <Pressable style={styles.circleBtn} onPress={() => navigation.goBack()} hitSlop={10}>
              <ArrowLeft size={22} color={colors.white} />
            </Pressable>
          </SafeAreaView>
          <View style={styles.heroMeta}>
            {typeof plan.ai_score === 'number' && plan.ai_score > 0 ? (
              <View style={styles.aiBadge}>
                <Sparkles size={12} color={colors.white} />
                <AppText variant="label" color={colors.white}>
                  {Math.round(plan.ai_score)}% match
                </AppText>
              </View>
            ) : null}
            <AppText variant="hero" color={colors.white}>
              {plan.name || plan.to}
            </AppText>
            <View style={styles.heroRow}>
              <MapPin size={14} color="rgba(255,255,255,0.9)" />
              <AppText variant="caption" color="rgba(255,255,255,0.9)">
                from {plan.from}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Quick stats */}
          <View style={styles.stats}>
            <Stat icon={<CalendarDays size={18} color={colors.brand} />} label="Days" value={plan.days ? String(plan.days) : '—'} />
            <Stat icon={<Users size={18} color={colors.green} />} label="Travelers" value={plan.travelers ? String(plan.travelers) : '—'} />
            <Stat
              icon={<Star size={18} color={colors.gold} />}
              label="Rating"
              value={plan.star ? plan.star.toFixed(1) : '—'}
            />
            <Stat
              icon={<Wallet size={18} color={colors.purple} />}
              label="Total"
              value={total ? `${cur}${Math.round(Number(total) / 1000)}k` : '—'}
            />
          </View>

          {plan.destination_overview ? (
            <Section title="Overview">
              <AppText variant="body" color={colors.ink700} style={styles.para}>
                {plan.destination_overview}
              </AppText>
            </Section>
          ) : null}

          {plan.perfect_for && plan.perfect_for.length > 0 ? (
            <View style={styles.tags}>
              {plan.perfect_for.map(t => (
                <View key={t} style={styles.tag}>
                  <AppText variant="label" color={colors.ink600}>
                    {t}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          {/* Budget breakdown */}
          {bb && total ? (
            <Section title="Budget breakdown">
              <Card style={styles.budgetCard} rounded="xl">
                {BUDGET_ROWS.map(row => {
                  const val = Number(bb[row.key] ?? 0);
                  if (!val) return null;
                  const pct = Math.min(100, Math.round((val / Number(total)) * 100));
                  return (
                    <View key={row.key} style={styles.budgetRow}>
                      <View style={styles.budgetLabel}>
                        <View style={[styles.budgetDot, { backgroundColor: row.color }]} />
                        <AppText variant="body">{row.label}</AppText>
                      </View>
                      <View style={styles.budgetBarTrack}>
                        <View style={[styles.budgetBar, { width: `${pct}%`, backgroundColor: row.color }]} />
                      </View>
                      <AppText variant="caption" muted style={styles.budgetVal}>
                        {cur}
                        {Math.round(val).toLocaleString()}
                      </AppText>
                    </View>
                  );
                })}
                <View style={styles.budgetTotal}>
                  <AppText variant="bodyStrong">Total</AppText>
                  <AppText variant="h3" color={colors.brandDark}>
                    {cur}
                    {Math.round(Number(total)).toLocaleString()}
                  </AppText>
                </View>
              </Card>
            </Section>
          ) : null}

          {/* Itinerary */}
          {plan.suggested_itinerary && plan.suggested_itinerary.length > 0 ? (
            <Section title="Suggested itinerary">
              {plan.suggested_itinerary.map((day, i) => (
                <View key={i} style={styles.dayRow}>
                  <View style={styles.dayLine}>
                    <View style={styles.dayDot}>
                      <AppText variant="label" color={colors.white}>
                        {day.day ?? i + 1}
                      </AppText>
                    </View>
                    {i < plan.suggested_itinerary!.length - 1 ? <View style={styles.dayConnector} /> : null}
                  </View>
                  <View style={styles.dayContent}>
                    <AppText variant="h3">{day.title || `Day ${day.day ?? i + 1}`}</AppText>
                    {day.description ? (
                      <AppText variant="caption" muted style={{ marginTop: 2 }}>
                        {day.description}
                      </AppText>
                    ) : null}
                    <View style={styles.slots}>
                      {(['morning', 'afternoon', 'evening'] as const).map(slot =>
                        day[slot] ? (
                          <View key={slot} style={styles.slot}>
                            <AppText variant="label" color={colors.brand} style={styles.slotLabel}>
                              {slot.toUpperCase()}
                            </AppText>
                            <AppText variant="body" color={colors.ink700} style={{ flex: 1 }}>
                              {day[slot]}
                            </AppText>
                          </View>
                        ) : null,
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </Section>
          ) : null}

          {/* Highlights */}
          {plan.trip_highlights && plan.trip_highlights.length > 0 ? (
            <Section title="Trip highlights">
              {plan.trip_highlights.map((h, i) => (
                <Card key={i} style={styles.highlight} rounded="lg">
                  <AppText variant="bodyStrong">{h.name}</AppText>
                  {h.description ? (
                    <AppText variant="caption" muted style={{ marginTop: 4 }}>
                      {h.description}
                    </AppText>
                  ) : null}
                </Card>
              ))}
            </Section>
          ) : null}

          {/* How to reach */}
          {plan.how_to_reach?.best_way ? (
            <Section title="Getting there">
              <Card style={styles.reach} rounded="lg">
                <View style={styles.reachHead}>
                  <Bus size={18} color={colors.brand} />
                  <AppText variant="bodyStrong" style={{ flex: 1 }}>
                    {plan.how_to_reach.best_way}
                  </AppText>
                </View>
                {plan.how_to_reach.arrival_tips?.slice(0, 3).map((t, i) => (
                  <AppText key={i} variant="caption" muted style={{ marginTop: 6 }}>
                    • {t}
                  </AppText>
                ))}
              </Card>
            </Section>
          ) : null}

          {/* Local tips */}
          {plan.local_tips && plan.local_tips.length > 0 ? (
            <Section title="Local tips">
              {plan.local_tips.map((t, i) => (
                <View key={i} style={styles.tipRow}>
                  <Lightbulb size={16} color={colors.gold} />
                  <AppText variant="body" color={colors.ink700} style={{ flex: 1 }}>
                    {t}
                  </AppText>
                </View>
              ))}
            </Section>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky save bar */}
      <View style={[styles.saveBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {msg ? (
          <AppText variant="caption" color={saved ? colors.success : colors.danger} center style={styles.saveMsg}>
            {msg}
          </AppText>
        ) : null}
        <Pressable
          style={[styles.saveBtn, saved && styles.savedBtn]}
          onPress={() => !saved && plan._id && saveMut.mutate()}
          disabled={saved || saveMut.isPending}>
          {saved ? (
            <BookmarkCheck size={20} color={colors.white} />
          ) : (
            <Bookmark size={20} color={colors.white} />
          )}
          <AppText variant="button" color={colors.white}>
            {saveMut.isPending ? 'Saving…' : saved ? 'Saved to favorites' : 'Save to favorites'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="h3" style={styles.sectionTitle}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      {icon}
      <AppText variant="bodyStrong" style={{ marginTop: 4 }}>
        {value}
      </AppText>
      <AppText variant="label" muted>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  hero: { height: 320, backgroundColor: colors.surface },
  heroImg: { width: '100%', height: '100%' },
  heroBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMeta: { position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: spacing.xl },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(47,144,234,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  body: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    marginTop: -24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center' },
  section: { marginTop: spacing.xxl },
  sectionTitle: { marginBottom: spacing.md },
  para: { lineHeight: 23 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.lg },
  tag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  budgetCard: { backgroundColor: colors.white, ...shadow.sm, gap: spacing.md },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  budgetLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 96 },
  budgetDot: { width: 8, height: 8, borderRadius: 4 },
  budgetBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  budgetBar: { height: 8, borderRadius: 4 },
  budgetVal: { width: 64, textAlign: 'right' },
  budgetTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  dayRow: { flexDirection: 'row', gap: spacing.md },
  dayLine: { alignItems: 'center', width: 32 },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayConnector: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 4 },
  dayContent: { flex: 1, paddingBottom: spacing.xl },
  slots: { marginTop: spacing.md, gap: spacing.md },
  slot: { flexDirection: 'row', gap: spacing.md },
  slotLabel: { width: 74, marginTop: 2, letterSpacing: 0.5 },
  highlight: { backgroundColor: colors.white, ...shadow.sm, marginBottom: spacing.md },
  reach: { backgroundColor: colors.white, ...shadow.sm },
  reachHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: spacing.md },
  saveBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  saveMsg: { marginBottom: spacing.sm },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    ...shadow.md,
  },
  savedBtn: { backgroundColor: colors.success },
});
