import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Bus,
  CalendarDays,
  Clock,
  Lightbulb,
  MapPin,
  Moon,
  Share2,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Users,
  Wallet,
} from 'lucide-react-native';
import { AppText } from '../../components/ui';
import { Gradient } from '../../components/ui/Gradient';
import { SmartImage } from '../../components/ui/SmartImage';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import { getDestinationImages, getSavedPlans, savePlan, unsavePlan } from '../../services/plansService';
import { sharePlanToCommunity } from '../../services/communityService';
import { cleanTitle } from '../../lib/text';
import { tapMedium, notifySuccess } from '../../lib/haptics';
import { apiErrorMessage } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import type { MainStackScreenProps } from '../../navigation/types';
import type { BudgetBreakdown } from '../../types/plan';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = 360;
const FALLBACK =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1000&auto=format&fit=crop';

const BUDGET_ROWS: { key: keyof BudgetBreakdown; label: string; color: string }[] = [
  { key: 'flights', label: 'Flights', color: colors.brand },
  { key: 'accommodation', label: 'Stay', color: colors.purple },
  { key: 'activities', label: 'Activities', color: colors.green },
  { key: 'food', label: 'Food', color: colors.coral },
];

const SLOTS = [
  { key: 'morning', label: 'Morning', Icon: Sunrise, tint: colors.gold },
  { key: 'afternoon', label: 'Afternoon', Icon: Sun, tint: colors.coral },
  { key: 'evening', label: 'Evening', Icon: Moon, tint: colors.purple },
] as const;

function currencySymbol(c?: string) {
  return c === 'EUR' ? '€' : c === 'INR' ? '₹' : c === 'GBP' ? '£' : '$';
}

export function PlanDetailScreen({ navigation, route }: MainStackScreenProps<'PlanDetail'>) {
  const { plan } = route.params;
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [msg, setMsg] = useState('');
  const [override, setOverride] = useState<boolean | null>(null);

  const title = cleanTitle(plan.name || plan.to);

  // Real destination photos (public endpoint) for the gallery strip.
  const { data: gallery } = useQuery({
    queryKey: ['destination-images', title],
    queryFn: () => getDestinationImages(title, 8),
    staleTime: 30 * 60 * 1000,
  });

  // Is this plan already in the user's saved (liked) trips?
  const { data: savedPlans } = useQuery({ queryKey: ['saved-plans'], queryFn: getSavedPlans });
  const serverSaved = !!savedPlans?.some(p => p._id === plan._id);
  const saved = override ?? serverSaved;

  const afterChange = () => {
    queryClient.invalidateQueries({ queryKey: ['saved-plans'] });
  };

  const saveMut = useMutation({
    mutationFn: () => savePlan(plan._id as string),
    onMutate: () => setOverride(true),
    onSuccess: () => {
      setMsg('Saved to your trips');
      notifySuccess();
      afterChange();
    },
    onError: e => {
      setOverride(false);
      setMsg(apiErrorMessage(e));
    },
  });

  const unsaveMut = useMutation({
    mutationFn: () => unsavePlan(plan._id as string),
    onMutate: () => setOverride(false),
    onSuccess: () => {
      setMsg('Removed from saved trips');
      afterChange();
    },
    onError: e => {
      setOverride(true);
      setMsg(apiErrorMessage(e));
    },
  });

  const busy = saveMut.isPending || unsaveMut.isPending;
  const toggleSave = () => {
    if (!plan._id || busy) return;
    tapMedium();
    saved ? unsaveMut.mutate() : saveMut.mutate();
  };

  // Share this generated plan to the community feed (links the plan via tripId).
  const [shared, setShared] = useState(false);
  const shareMut = useMutation({
    mutationFn: () =>
      sharePlanToCommunity({
        title: `${title} — a ${plan.days ?? ''}-day trip`.replace(' -day', '-day'),
        content:
          plan.destination_overview ||
          `Check out this AI-crafted trip to ${title}${plan.from ? ` from ${plan.from}` : ''}${
            total ? `, around ${cur}${Math.round(total).toLocaleString()}` : ''
          }.`,
        category: 'Guide',
        tripId: plan._id as string,
        imageUrl: plan.image_url,
        tags: (plan.perfect_for ?? plan.activities ?? []).slice(0, 4),
      }),
    onSuccess: () => {
      setShared(true);
      notifySuccess();
      setMsg('Shared to the community feed');
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
    },
    onError: e => setMsg(apiErrorMessage(e)),
  });
  const shareToCommunity = () => {
    if (!plan._id || shared || shareMut.isPending) return;
    tapMedium();
    shareMut.mutate();
  };

  const bb = plan.budget_breakdown;
  const total = Number(bb?.total ?? plan.cost ?? 0);
  const cur = currencySymbol(bb?.currency);

  const segments = BUDGET_ROWS.map(r => ({ ...r, value: Number(bb?.[r.key] ?? 0) })).filter(
    s => s.value > 0,
  );
  const segTotal = segments.reduce((s, x) => s + x.value, 0) || total || 1;

  const onShare = async () => {
    try {
      await Share.share({
        message: `${title} — a ${plan.days ?? ''}-day trip idea from AI Travel Planner${
          total ? ` (approx ${cur}${Math.round(total).toLocaleString()})` : ''
        }`,
      });
    } catch {}
  };

  // Parallax + fading compact header
  const heroTranslate = scrollY.interpolate({
    inputRange: [-200, 0, HERO_H],
    outputRange: [-60, 0, HERO_H * 0.35],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp',
  });
  const heroScale = scrollY.interpolate({
    inputRange: [-200, 0],
    outputRange: [1.35, 1],
    extrapolateRight: 'clamp',
  });
  const heroFade = scrollY.interpolate({
    inputRange: [0, HERO_H * 0.55],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const barOpacity = scrollY.interpolate({
    inputRange: [HERO_H * 0.45, HERO_H * 0.72],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.root}>
      {/* Parallax hero */}
      <Animated.View
        style={[
          styles.hero,
          { transform: [{ translateY: heroTranslate }, { scale: heroScale }] },
        ]}>
        <SmartImage uri={plan.image_url} seed={title} style={styles.heroImg} />
        <Gradient
          colors={['rgba(8,14,28,0.55)', 'rgba(8,14,28,0.05)', 'rgba(8,14,28,0.88)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Compact header that fades in on scroll */}
      <Animated.View style={[styles.compactBar, { opacity: barOpacity, paddingTop: insets.top }]}>
        <View style={styles.compactInner}>
          <AppText variant="h3" numberOfLines={1} style={{ flex: 1 }}>
            {title}
          </AppText>
        </View>
      </Animated.View>

      {/* Floating hero actions */}
      <SafeAreaView edges={['top']} style={styles.heroActions} pointerEvents="box-none">
        <Pressable style={styles.glassBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={21} color={colors.white} />
        </Pressable>
        <Pressable style={styles.glassBtn} onPress={onShare} hitSlop={10}>
          <Share2 size={19} color={colors.white} />
        </Pressable>
      </SafeAreaView>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        contentContainerStyle={{ paddingBottom: 130 }}>
        {/* Hero text block */}
        <Animated.View style={[styles.heroText, { opacity: heroFade }]}>
          {typeof plan.ai_score === 'number' && plan.ai_score > 0 ? (
            <View style={styles.aiBadge}>
              <Sparkles size={12} color={colors.white} />
              <AppText variant="label" color={colors.white}>
                {Math.round(plan.ai_score)}% match
              </AppText>
            </View>
          ) : null}
          <AppText variant="hero" color={colors.white} style={styles.heroTitle}>
            {title}
          </AppText>
          <View style={styles.heroMetaRow}>
            <MapPin size={14} color="rgba(255,255,255,0.9)" />
            <AppText variant="caption" color="rgba(255,255,255,0.92)">
              from {plan.from}
            </AppText>
            {typeof plan.star === 'number' && plan.star > 0 ? (
              <View style={styles.heroStar}>
                <Star size={12} color={colors.gold} fill={colors.gold} />
                <AppText variant="label" color={colors.white}>
                  {plan.star.toFixed(1)}
                  {plan.total_reviews ? ` (${plan.total_reviews})` : ''}
                </AppText>
              </View>
            ) : null}
          </View>
        </Animated.View>

        {/* Content sheet */}
        <View style={styles.sheet}>
          <View style={styles.grabber} />

          {/* Stats */}
          <View style={styles.statsCard}>
            <Stat icon={<CalendarDays size={17} color={colors.brand} />} value={plan.days ? `${plan.days}` : '—'} label="Days" />
            <Divider />
            <Stat icon={<Users size={17} color={colors.green} />} value={plan.travelers ? `${plan.travelers}` : '—'} label="Guests" />
            <Divider />
            <Stat
              icon={<Wallet size={17} color={colors.purple} />}
              value={total ? `${cur}${Math.round(total / 1000)}k` : '—'}
              label="Budget"
            />
            <Divider />
            <Stat
              icon={<Star size={17} color={colors.gold} />}
              value={plan.star ? plan.star.toFixed(1) : '—'}
              label="Rating"
            />
          </View>

          {/* Tags */}
          {plan.perfect_for && plan.perfect_for.length > 0 ? (
            <View style={styles.tags}>
              {plan.perfect_for.map(t => (
                <View key={t} style={styles.tag}>
                  <AppText variant="label" color={colors.brandDark}>
                    {t}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          {/* Share to community */}
          {plan._id ? (
            <View style={styles.shareCard}>
              <View style={styles.shareIcon}>
                <Users size={20} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">Loved this plan?</AppText>
                <AppText variant="caption" muted>
                  Share it with the community — get likes & tips.
                </AppText>
              </View>
              <Pressable
                style={[styles.shareCta, shared && styles.shareCtaDone]}
                onPress={shareToCommunity}
                disabled={shared || shareMut.isPending}>
                <AppText variant="label" color={shared ? colors.success : colors.white}>
                  {shareMut.isPending ? '…' : shared ? 'Shared' : 'Share'}
                </AppText>
              </Pressable>
            </View>
          ) : null}

          {/* Overview */}
          {plan.destination_overview ? (
            <Section title="Overview">
              <AppText variant="body" color={colors.ink700} style={styles.para}>
                {plan.destination_overview}
              </AppText>
            </Section>
          ) : null}

          {/* Photo gallery */}
          {gallery && gallery.length > 0 ? (
            <Section title="Gallery" noPad>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.gallery}>
                {gallery.slice(0, 8).map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.galleryImg} resizeMode="cover" />
                ))}
              </ScrollView>
            </Section>
          ) : null}

          {/* Budget */}
          {segments.length > 0 ? (
            <Section title="Where the money goes">
              <View style={styles.budgetCard}>
                <View style={styles.budgetHead}>
                  <AppText variant="caption" muted>
                    Estimated total
                  </AppText>
                  <AppText variant="h1" color={colors.ink900}>
                    {cur}
                    {Math.round(total || segTotal).toLocaleString()}
                  </AppText>
                </View>

                {/* Stacked bar */}
                <View style={styles.stack}>
                  {segments.map((s, i) => (
                    <View
                      key={s.key}
                      style={{
                        flex: s.value / segTotal,
                        backgroundColor: s.color,
                        borderTopLeftRadius: i === 0 ? 6 : 0,
                        borderBottomLeftRadius: i === 0 ? 6 : 0,
                        borderTopRightRadius: i === segments.length - 1 ? 6 : 0,
                        borderBottomRightRadius: i === segments.length - 1 ? 6 : 0,
                      }}
                    />
                  ))}
                </View>

                {/* Legend */}
                <View style={styles.legend}>
                  {segments.map(s => (
                    <View key={s.key} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                      <AppText variant="body" style={{ flex: 1 }}>
                        {s.label}
                      </AppText>
                      <AppText variant="caption" muted>
                        {Math.round((s.value / segTotal) * 100)}%
                      </AppText>
                      <AppText variant="bodyStrong" style={styles.legendVal}>
                        {cur}
                        {Math.round(s.value).toLocaleString()}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
            </Section>
          ) : null}

          {/* Itinerary */}
          {plan.suggested_itinerary && plan.suggested_itinerary.length > 0 ? (
            <Section title="Day by day">
              {plan.suggested_itinerary.map((day, i) => (
                <View key={i} style={styles.dayCard}>
                  <View style={styles.dayHead}>
                    <Gradient colors={colors.brandGradient} style={styles.dayBadge}>
                      <AppText variant="label" color={colors.white}>
                        {String(day.day ?? i + 1).padStart(2, '0')}
                      </AppText>
                    </Gradient>
                    <View style={{ flex: 1 }}>
                      <AppText variant="h3" numberOfLines={2}>
                        {day.title || `Day ${day.day ?? i + 1}`}
                      </AppText>
                      {day.description ? (
                        <AppText variant="caption" muted numberOfLines={2} style={{ marginTop: 2 }}>
                          {day.description}
                        </AppText>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.slots}>
                    {SLOTS.map(({ key, label, Icon, tint }) =>
                      day[key] ? (
                        <View key={key} style={styles.slotRow}>
                          <View style={[styles.slotIcon, { backgroundColor: tint + '1A' }]}>
                            <Icon size={15} color={tint} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <AppText variant="label" color={tint}>
                              {label.toUpperCase()}
                            </AppText>
                            <AppText variant="body" color={colors.ink700}>
                              {day[key]}
                            </AppText>
                          </View>
                        </View>
                      ) : null,
                    )}
                  </View>

                  {day.activities && day.activities.length > 0 ? (
                    <View style={styles.actWrap}>
                      {day.activities.slice(0, 4).map((a, ai) => (
                        <View key={ai} style={styles.actChip}>
                          <AppText variant="label" color={colors.ink700} numberOfLines={1}>
                            {a.name}
                          </AppText>
                          {a.time ? (
                            <View style={styles.actMeta}>
                              <Clock size={10} color={colors.ink400} />
                              <AppText variant="label" muted>
                                {a.time}
                              </AppText>
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ))}
            </Section>
          ) : null}

          {/* Highlights */}
          {plan.trip_highlights && plan.trip_highlights.length > 0 ? (
            <Section title="Don't miss" noPad>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hlRow}>
                {plan.trip_highlights.map((h, i) => (
                  <View key={i} style={styles.hlCard}>
                    <Gradient
                      colors={[colors.sky300, colors.sky100]}
                      style={styles.hlIcon}>
                      <Sparkles size={18} color={colors.brandDark} />
                    </Gradient>
                    <AppText variant="bodyStrong" numberOfLines={2} style={{ marginTop: spacing.sm }}>
                      {h.name}
                    </AppText>
                    {h.description ? (
                      <AppText variant="caption" muted numberOfLines={3} style={{ marginTop: 4 }}>
                        {h.description}
                      </AppText>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            </Section>
          ) : null}

          {/* Getting there */}
          {plan.how_to_reach?.best_way ? (
            <Section title="Getting there">
              <View style={styles.reachCard}>
                <View style={styles.reachHead}>
                  <View style={styles.reachIcon}>
                    <Bus size={18} color={colors.brand} />
                  </View>
                  <AppText variant="bodyStrong" style={{ flex: 1 }}>
                    {plan.how_to_reach.best_way}
                  </AppText>
                </View>
                {plan.how_to_reach.arrival_tips?.slice(0, 4).map((t, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={styles.bullet} />
                    <AppText variant="caption" muted style={{ flex: 1 }}>
                      {t}
                    </AppText>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}

          {/* Local tips */}
          {plan.local_tips && plan.local_tips.length > 0 ? (
            <Section title="Local tips">
              {plan.local_tips.map((t, i) => (
                <View key={i} style={styles.tipCard}>
                  <View style={styles.tipIcon}>
                    <Lightbulb size={15} color={colors.gold} />
                  </View>
                  <AppText variant="body" color={colors.ink700} style={{ flex: 1 }}>
                    {t}
                  </AppText>
                </View>
              ))}
            </Section>
          ) : null}
        </View>
      </Animated.ScrollView>

      {/* Sticky action bar */}
      <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {msg ? (
          <AppText
            variant="caption"
            color={saved ? colors.success : colors.danger}
            center
            style={styles.actionMsg}>
            {msg}
          </AppText>
        ) : null}
        <View style={styles.actionRow}>
          <Pressable style={styles.shareBtn} onPress={onShare}>
            <Share2 size={20} color={colors.ink800} />
          </Pressable>
          <Pressable style={styles.saveWrap} onPress={toggleSave} disabled={busy}>
            <Gradient
              colors={saved ? [colors.green, '#28A745'] : colors.brandGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveBtn}>
              {saved ? (
                <BookmarkCheck size={20} color={colors.white} />
              ) : (
                <Bookmark size={20} color={colors.white} />
              )}
              <AppText variant="button" color={colors.white}>
                {busy ? 'Saving…' : saved ? 'Saved · tap to remove' : 'Save this trip'}
              </AppText>
            </Gradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Section({
  title,
  children,
  noPad,
}: {
  title: string;
  children: React.ReactNode;
  noPad?: boolean;
}) {
  return (
    <View style={styles.section}>
      <AppText variant="h2" style={[styles.sectionTitle, noPad && styles.sectionTitlePad]}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      {icon}
      <AppText variant="h3" style={{ marginTop: 4 }}>
        {value}
      </AppText>
      <AppText variant="label" muted>
        {label}
      </AppText>
    </View>
  );
}

const Divider = () => <View style={styles.statDivider} />;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_H, backgroundColor: colors.surface },
  heroImg: { width: '100%', height: '100%' },
  compactBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  compactInner: {
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 76,
  },
  heroActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  glassBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15,25,45,0.42)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  heroText: {
    height: HERO_H,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(47,144,234,0.95)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  heroTitle: { lineHeight: 40 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  heroStar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    marginTop: -26,
    paddingTop: spacing.md,
    minHeight: 600,
  },
  grabber: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.lg,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    ...shadow.card,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: colors.border },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  shareIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareCta: {
    paddingHorizontal: 18,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareCtaDone: { backgroundColor: colors.greenSoft },
  tag: {
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  section: { marginTop: spacing.xxl },
  sectionTitle: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  sectionTitlePad: {},
  para: { paddingHorizontal: spacing.xl, lineHeight: 23 },
  gallery: { paddingHorizontal: spacing.xl, gap: spacing.md },
  galleryImg: {
    width: SCREEN_W * 0.62,
    height: 170,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  budgetCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.card,
  },
  budgetHead: { marginBottom: spacing.md },
  stack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    gap: 2,
  },
  legend: { marginTop: spacing.lg, gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendVal: { width: 78, textAlign: 'right' },
  dayCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.sm,
  },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slots: { marginTop: spacing.lg, gap: spacing.md },
  slotRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  slotIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.lg },
  actChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.md,
    maxWidth: '100%',
    gap: 2,
  },
  actMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hlRow: { paddingHorizontal: spacing.xl, gap: spacing.md },
  hlCard: {
    width: 210,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.sm,
  },
  hlIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reachCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.sm,
  },
  reachHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reachIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md },
  bullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.ink300 },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  tipIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBar: {
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
  actionMsg: { marginBottom: spacing.sm },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  shareBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveWrap: { flex: 1 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: radius.pill,
    ...shadow.md,
  },
});
