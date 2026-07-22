import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import LottieView from 'lottie-react-native';
import { ArrowLeft, RefreshCw, Sparkles, Users, Wallet } from 'lucide-react-native';
import { AppText, Button } from '../../components/ui';
import { Gradient } from '../../components/ui/Gradient';
import { PlanCard } from '../../components/PlanCard';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import { searchDestination } from '../../services/plansService';
import { apiErrorMessage } from '../../lib/api';
import { formatFriendly } from '../../components/ui/DatePickerSheet';
import type { MainStackScreenProps } from '../../navigation/types';

export function PlanResultsScreen({ navigation, route }: MainStackScreenProps<'PlanResults'>) {
  const { input } = route.params;

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['plan-search', input],
    queryFn: () => searchDestination(input),
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  const cur = input.budget >= 100000 ? '₹' : '₹';

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
            <ArrowLeft size={21} color={colors.ink800} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <AppText variant="h2" numberOfLines={1}>
              {input.to}
            </AppText>
            <AppText variant="caption" muted numberOfLines={1}>
              from {input.from} · {formatFriendly(input.date)}
            </AppText>
          </View>
          {!isLoading ? (
            <Pressable style={styles.circle} onPress={() => refetch()} hitSlop={10}>
              <RefreshCw size={17} color={colors.ink700} />
            </Pressable>
          ) : (
            <View style={styles.circle} />
          )}
        </View>

        {/* Trip summary chips */}
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Users size={13} color={colors.green} />
            <AppText variant="label" color={colors.ink700}>
              {input.travelers} {input.travelers === 1 ? 'traveler' : 'travelers'}
            </AppText>
          </View>
          <View style={styles.chip}>
            <Wallet size={13} color={colors.purple} />
            <AppText variant="label" color={colors.ink700}>
              {cur}
              {Number(input.budget).toLocaleString('en-IN')}
            </AppText>
          </View>
          {input.duration ? (
            <View style={styles.chip}>
              <AppText variant="label" color={colors.ink700}>
                {input.duration} days
              </AppText>
            </View>
          ) : null}
        </View>

        {isLoading ? (
          <LoadingState to={input.to} />
        ) : isError ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <ErrorState
            message="The AI couldn't craft a trip this time. Try tweaking your inputs."
            onRetry={() => refetch()}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.countRow}>
              <Gradient colors={colors.brandGradient} style={styles.countBadge}>
                <Sparkles size={12} color={colors.white} />
              </Gradient>
              <AppText variant="bodyStrong" style={{ flex: 1 }}>
                {isRefetching
                  ? 'Refreshing…'
                  : `${data.length} AI-crafted ${data.length === 1 ? 'trip' : 'trips'}`}
              </AppText>
            </View>

            {data.map((plan, i) => (
              <FadeInUp key={plan._id ?? `${plan.name}-${i}`} delay={i * 90}>
                <PlanCard plan={plan} onPress={() => navigation.navigate('PlanDetail', { plan })} />
              </FadeInUp>
            ))}
            <View style={{ height: spacing.xxl }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

/** Staggered entrance for result cards. */
function FadeInUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 420,
      delay,
      useNativeDriver: true,
    }).start();
  }, [v, delay]);
  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
      }}>
      {children}
    </Animated.View>
  );
}

/** Pulsing placeholder card shown while the AI generates. */
function SkeletonCard() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.skeleton, { opacity: pulse }]}>
      <View style={styles.skImage} />
      <View style={styles.skBody}>
        <View style={[styles.skLine, { width: '45%' }]} />
        <View style={[styles.skLine, { width: '85%', marginTop: 10 }]} />
        <View style={[styles.skLine, { width: '65%', marginTop: 8 }]} />
      </View>
    </Animated.View>
  );
}

function LoadingState({ to }: { to: string }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.loadingHead}>
        <LottieView
          source={require('../../assets/lottie/travel-bag.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
        <AppText variant="h2" center>
          Crafting your trip…
        </AppText>
        <AppText variant="body" muted center style={styles.loadingText}>
          Our AI is designing a personalized itinerary for {to}. This can take a
          few moments.
        </AppText>
      </View>
      <SkeletonCard />
      <SkeletonCard />
    </ScrollView>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <AppText variant="h3" center>
        Hmm, something went sideways
      </AppText>
      <AppText variant="body" muted center style={styles.loadingText}>
        {message}
      </AppText>
      <View style={{ height: spacing.xl, width: '70%' }}>
        <Button label="Try again" onPress={onRetry} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.lg },
  countBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  loadingHead: { alignItems: 'center', paddingBottom: spacing.xl },
  lottie: { width: 170, height: 170 },
  loadingText: { marginTop: spacing.sm, paddingHorizontal: spacing.md },
  skeleton: {
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadow.sm,
  },
  skImage: { height: 210, backgroundColor: colors.surface },
  skBody: { padding: spacing.lg },
  skLine: { height: 12, borderRadius: 6, backgroundColor: colors.surface },
});
