import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, Compass, Plus } from 'lucide-react-native';
import { AppText, Button, EmptyState } from '../../components/ui';
import { Gradient } from '../../components/ui/Gradient';
import { PlanCard } from '../../components/PlanCard';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme';
import { getMyPlans, getSavedPlans } from '../../services/plansService';
import type { TabScreenProps } from '../../navigation/types';

type View2 = 'all' | 'saved';

export function TripsScreen({ navigation, route }: TabScreenProps<'Trips'>) {
  const initial = (route.params as { view?: View2 } | undefined)?.view ?? 'all';
  const [view, setView] = useState<View2>(initial);

  const all = useQuery({ queryKey: ['my-plans'], queryFn: getMyPlans });
  const saved = useQuery({ queryKey: ['saved-plans'], queryFn: getSavedPlans });

  const active = view === 'saved' ? saved : all;
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

        {/* Segmented control */}
        <View style={styles.segment}>
          {([
            { key: 'all', label: `All${all.data ? ` · ${all.data.length}` : ''}` },
            { key: 'saved', label: `Saved${saved.data ? ` · ${saved.data.length}` : ''}` },
          ] as { key: View2; label: string }[]).map(t => {
            const on = view === t.key;
            return (
              <Pressable key={t.key} style={styles.segmentItem} onPress={() => setView(t.key)}>
                {on ? (
                  <Gradient
                    colors={colors.brandGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}
                <AppText variant="bodyStrong" color={on ? colors.white : colors.ink500}>
                  {t.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={active.data ?? []}
          keyExtractor={(item, i) => item._id ?? String(i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={active.isRefetching}
          onRefresh={active.refetch}
          renderItem={({ item }) => (
            <PlanCard plan={item} onPress={() => navigation.navigate('PlanDetail', { plan: item })} />
          )}
          ListEmptyComponent={
            view === 'saved' ? (
              <EmptyState
                loading={saved.isLoading}
                loadingLabel="Loading saved trips…"
                icon={<Bookmark size={30} color={colors.brand} />}
                title="No saved trips yet"
                subtitle="Tap “Save this trip” on any plan and it will appear here."
                actionLabel="Browse my plans"
                onAction={() => setView('all')}
              />
            ) : (
              <EmptyState
                loading={all.isLoading}
                loadingLabel="Loading your trips…"
                icon={<Compass size={30} color={colors.brand} />}
                title="No trips yet"
                subtitle="Plan your first adventure with AI and it will show up here."
                actionLabel="Plan a trip"
                actionIcon={<Plus size={18} color={colors.white} />}
                onAction={openPlanner}
              />
            )
          }
        />
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
  segment: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    height: 40,
    borderRadius: radius.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 130 },
});
