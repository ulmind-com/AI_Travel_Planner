import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import LottieView from 'lottie-react-native';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { AppText, Button } from '../../components/ui';
import { PlanCard } from '../../components/PlanCard';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme';
import { searchDestination } from '../../services/plansService';
import { apiErrorMessage } from '../../lib/api';
import type { MainStackScreenProps } from '../../navigation/types';

export function PlanResultsScreen({ navigation, route }: MainStackScreenProps<'PlanResults'>) {
  const { input } = route.params;

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['plan-search', input],
    queryFn: () => searchDestination(input),
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.ink800} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="h3" numberOfLines={1}>
            {input.to}
          </AppText>
          <AppText variant="caption" muted>
            from {input.from} · {input.travelers} travelers
          </AppText>
        </View>
        {!isLoading ? (
          <Pressable style={styles.back} onPress={() => refetch()} hitSlop={10}>
            <RefreshCw size={18} color={colors.ink700} />
          </Pressable>
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
          <AppText variant="body" muted style={styles.count}>
            {isRefetching ? 'Refreshing…' : `${data.length} AI-crafted ${data.length === 1 ? 'trip' : 'trips'} for you`}
          </AppText>
          {data.map((plan, i) => (
            <PlanCard
              key={plan._id ?? `${plan.name}-${i}`}
              plan={plan}
              onPress={() => navigation.navigate('PlanDetail', { plan })}
            />
          ))}
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function LoadingState({ to }: { to: string }) {
  return (
    <View style={styles.center}>
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
        Our AI is designing a personalized itinerary for {to}. This can take a few
        moments.
      </AppText>
    </View>
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
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  count: { marginBottom: spacing.md },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  lottie: { width: 200, height: 200 },
  loadingText: { marginTop: spacing.md, paddingHorizontal: spacing.md },
});
