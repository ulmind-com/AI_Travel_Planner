import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Compass, Plus, Search } from 'lucide-react-native';
import { AppText, EmptyState } from '../../components/ui';
import { ExperienceCard } from '../../components/ExperienceCard';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import { getExperienceFeed } from '../../services/experiencesService';
import type { TabScreenProps } from '../../navigation/types';

export function ExploreScreen({ navigation }: TabScreenProps<'Explore'>) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['experience-feed'],
    queryFn: getExperienceFeed,
  });

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <FlatList
          data={data ?? []}
          keyExtractor={(item, i) => item._id ?? String(i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={
            <View style={styles.header}>
              <AppText variant="h1">Explore</AppText>
              <AppText variant="body" muted style={{ marginBottom: spacing.lg }}>
                Real experiences from travelers.
              </AppText>
              <Pressable
                style={styles.search}
                onPress={() => navigation.navigate('People')}>
                <Search size={20} color={colors.ink400} />
                <AppText variant="body" color={colors.ink400}>
                  Search people & experiences…
                </AppText>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <ExperienceCard
              item={item}
              onPress={() => navigation.navigate('ExperienceDetail', { id: item._id })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              loading={isLoading}
              loadingLabel="Loading experiences…"
              icon={<Compass size={30} color={colors.brand} />}
              title="No experiences yet"
              subtitle="Share your first travel experience with the tap of the + button."
              actionLabel="Share experience"
              actionIcon={<Plus size={18} color={colors.white} />}
              onAction={() => navigation.navigate('CreateExperience')}
            />
          }
        />
      </SafeAreaView>

      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateExperience')}>
        <Plus size={26} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: 130 },
  header: { marginBottom: spacing.md },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: spacing.lg,
  },
  empty: { paddingTop: spacing.huge, alignItems: 'center' },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: 100,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
});
