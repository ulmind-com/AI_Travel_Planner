import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gradient as LinearGradient } from '../../components/ui/Gradient';
import {
  Bell,
  CalendarDays,
  Car,
  DollarSign,
  Hotel,
  MessageCircle,
  Plane,
  Route,
  Sparkles,
  Star,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { AppText, Card, Chip, IconTile } from '../../components/ui';
import { PlanCard } from '../../components/PlanCard';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { getRecommendations } from '../../services/plansService';
import { FEATURED, INSPIRE } from './homeData';
import type { TabScreenProps } from '../../navigation/types';

const FILTERS = [
  { key: 'timeline', label: 'Timeline', icon: <CalendarDays size={18} color={colors.green} /> },
  { key: 'distance', label: 'Distance', icon: <Route size={18} color={colors.coral} /> },
  { key: 'budget', label: 'Budget', icon: <DollarSign size={18} color={colors.brand} /> },
];

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const { profile, firebaseUser } = useAuth();
  const [filter, setFilter] = useState('timeline');

  const name =
    profile?.username || firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'Traveler';
  const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const openPlanner = (prefillTo?: string) => navigation.navigate('Planner', { prefillTo });
  const openChat = () => navigation.navigate('AIChat');

  const { data: recommended } = useQuery({
    queryKey: ['recommendations'],
    queryFn: getRecommendations,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" muted>
                {month}
              </AppText>
              <AppText variant="h1">Discover, {name}</AppText>
            </View>
            <Pressable style={styles.headerIcon} onPress={() => navigation.navigate('Conversations')} hitSlop={6}>
              <MessageCircle size={20} color={colors.ink700} />
            </Pressable>
            <Pressable style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')} hitSlop={6}>
              <Bell size={20} color={colors.ink700} />
            </Pressable>
          </View>

          {/* Category tiles */}
          <View style={styles.tiles}>
            <IconTile bg={colors.greenSoft} icon={<Plane size={22} color={colors.green} />} onPress={() => openPlanner()} />
            <IconTile bg={colors.coralSoft} icon={<Hotel size={22} color={colors.coral} />} onPress={() => openPlanner()} />
            <IconTile bg={colors.blueChipSoft} icon={<Car size={22} color={colors.blueChip} />} onPress={() => openPlanner()} />
            <IconTile bg={colors.purpleSoft} icon={<Sparkles size={22} color={colors.purple} />} onPress={() => openPlanner()} />
          </View>

          {/* Ask AI — opens the conversational assistant */}
          <Pressable style={styles.askWrap} onPress={openChat}>
            <View style={styles.askIcon}>
              <Sparkles size={18} color={colors.white} />
            </View>
            <AppText variant="body" color={colors.ink400} style={{ flex: 1 }}>
              Ask AI anything about travel…
            </AppText>
          </Pressable>

          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}>
            {FILTERS.map(f => (
              <Chip
                key={f.key}
                label={f.label}
                icon={f.icon}
                active={filter === f.key}
                onPress={() => setFilter(f.key)}
                style={{ marginRight: spacing.md }}
              />
            ))}
          </ScrollView>

          {/* Featured destination */}
          <FeaturedCard onPress={() => openPlanner(FEATURED.title)} />

          {/* Inspire — real AI recommendations, falling back to curated */}
          <View style={styles.sectionHead}>
            <AppText variant="h3">Inspire next adventure</AppText>
          </View>
          {recommended && recommended.length > 0
            ? recommended
                .slice(0, 6)
                .map((plan, i) => (
                  <PlanCard
                    key={plan._id ?? i}
                    plan={plan}
                    onPress={() => navigation.navigate('PlanDetail', { plan })}
                  />
                ))
            : INSPIRE.map(item => (
                <InspireRow key={item.id} item={item} onPress={() => openPlanner(item.title)} />
              ))}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function FeaturedCard({ onPress }: { onPress?: () => void }) {
  const f = FEATURED;
  return (
    <Pressable style={styles.featuredWrap} onPress={onPress}>
      <LinearGradient
        colors={f.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featured}>
        <View style={styles.featuredBody}>
          <AppText variant="label" color="rgba(255,255,255,0.85)">
            {f.from}
          </AppText>
          <AppText variant="h1" color={colors.white} style={{ marginTop: 2 }}>
            {f.title}
          </AppText>
          <View style={styles.bullets}>
            {f.highlights.map(h => (
              <View key={h} style={styles.bulletRow}>
                <View style={styles.dot} />
                <AppText variant="caption" color="rgba(255,255,255,0.9)">
                  {h}
                </AppText>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.emojiBadge}>
          <AppText variant="hero">{f.emoji}</AppText>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function InspireRow({ item, onPress }: { item: (typeof INSPIRE)[number]; onPress?: () => void }) {
  return (
    <Card onPress={onPress} style={styles.inspire} rounded="xl">
      <LinearGradient colors={item.gradient} style={styles.inspireThumb}>
        <AppText variant="h2">{item.emoji}</AppText>
      </LinearGradient>
      <View style={styles.inspireBody}>
        <AppText variant="h3">{item.title}</AppText>
        <View style={{ marginTop: 6, gap: 4 }}>
          {item.highlights.map(h => (
            <View key={h} style={styles.bulletRow}>
              <View style={[styles.dot, { backgroundColor: colors.ink300 }]} />
              <AppText variant="caption" muted>
                {h}
              </AppText>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.rating}>
        <Star size={14} color={colors.gold} fill={colors.gold} />
        <AppText variant="label" color={colors.ink700}>
          {item.rating}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  askWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: spacing.lg,
  },
  askIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { paddingVertical: 2, paddingRight: spacing.xl },
  featuredWrap: { marginTop: spacing.sm, marginBottom: spacing.xxl },
  featured: {
    borderRadius: radius.xxl,
    padding: spacing.xl,
    minHeight: 180,
    flexDirection: 'row',
    ...shadow.card,
  },
  featuredBody: { flex: 1, justifyContent: 'center' },
  bullets: { marginTop: spacing.md, gap: 6 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.9)' },
  emojiBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  sectionHead: { marginBottom: spacing.md },
  inspire: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    ...shadow.sm,
  },
  inspireThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  inspireBody: { flex: 1 },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
});
