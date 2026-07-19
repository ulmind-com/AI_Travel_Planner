import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import LottieView from 'lottie-react-native';
import { Plus } from 'lucide-react-native';
import { AppText, Button, Card } from '../../components/ui';
import { PlanCard } from '../../components/PlanCard';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme';
import { getMyPlans } from '../../services/plansService';
import type { TabScreenProps } from '../../navigation/types';

export function TripsScreen({ navigation }: TabScreenProps<'Trips'>) {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['my-plans'],
    queryFn: getMyPlans,
  });

  const openPlanner = () => navigation.navigate('Planner');

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="h1">My Trips</AppText>
            <AppText variant="body" muted>
              Your AI-crafted plans and journeys.
            </AppText>
          </View>
          <Button
            label="New"
            size="sm"
            fullWidth={false}
            icon={<Plus size={16} color={colors.white} />}
            onPress={openPlanner}
            style={styles.newBtn}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand} />
          }>
          {isLoading ? (
            <View style={styles.center}>
              <LottieView
                source={require('../../assets/lottie/travel-bag.json')}
                autoPlay
                loop
                style={styles.lottie}
              />
              <AppText variant="body" muted>
                Loading your trips…
              </AppText>
            </View>
          ) : isError ? (
            <Card style={styles.stateCard} rounded="xxl">
              <AppText variant="h3" center>
                Couldn't load your trips
              </AppText>
              <AppText variant="body" muted center style={styles.stateText}>
                Check your connection and pull to refresh.
              </AppText>
            </Card>
          ) : !data || data.length === 0 ? (
            <Card style={styles.stateCard} rounded="xxl">
              <LottieView
                source={require('../../assets/lottie/travel-bag.json')}
                autoPlay
                loop
                style={styles.lottie}
              />
              <AppText variant="h3" center>
                No trips yet
              </AppText>
              <AppText variant="body" muted center style={styles.stateText}>
                Plan your first adventure with AI and it will show up here.
              </AppText>
              <Button
                label="Plan a trip"
                fullWidth={false}
                icon={<Plus size={18} color={colors.white} />}
                onPress={openPlanner}
                style={styles.cta}
              />
            </Card>
          ) : (
            data.map((plan, i) => (
              <PlanCard
                key={plan._id ?? i}
                plan={plan}
                onPress={() => navigation.navigate('PlanDetail', { plan })}
              />
            ))
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  newBtn: { paddingHorizontal: spacing.lg },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  center: { alignItems: 'center', paddingTop: spacing.huge },
  lottie: { width: 160, height: 160 },
  stateCard: { alignItems: 'center', paddingVertical: spacing.xxxl, backgroundColor: colors.white },
  stateText: { marginTop: spacing.sm, paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  cta: { paddingHorizontal: spacing.xxl },
});
