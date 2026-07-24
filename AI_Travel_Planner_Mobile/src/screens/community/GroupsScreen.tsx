import React, { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, Users } from 'lucide-react-native';
import { AppText, Card, EmptyState } from '../../components/ui';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import { getGroups, joinGroup } from '../../services/communityService';
import { apiErrorMessage } from '../../lib/api';
import type { Group } from '../../types/community';
import type { MainStackScreenProps } from '../../navigation/types';

export function GroupsScreen({ navigation }: MainStackScreenProps<'Groups'>) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  });
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const join = async (g: Group) => {
    setBusy(g._id);
    try {
      await joinGroup(g._id);
      setJoined(prev => ({ ...prev, [g._id]: true }));
    } catch (e) {
      apiErrorMessage(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.ink800} />
        </Pressable>
        <AppText variant="h3">Travel groups</AppText>
        <View style={styles.circle} />
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(item, i) => item._id ?? String(i)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <Card style={styles.groupCard} rounded="xl" padded={false}>
            <View style={styles.groupThumb}>
              {item.image || item.coverImage ? (
                <Image source={{ uri: item.image || item.coverImage }} style={styles.groupImg} />
              ) : (
                <Users size={22} color={colors.brand} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {item.name}
              </AppText>
              <AppText variant="caption" muted numberOfLines={1}>
                {item.membersCount ?? item.members?.length ?? 0} members
                {item.category ? ` · ${item.category}` : ''}
              </AppText>
            </View>
            <Pressable
              style={[styles.joinBtn, joined[item._id] && styles.joinedBtn]}
              onPress={() => !joined[item._id] && join(item)}
              disabled={busy === item._id}>
              {joined[item._id] ? (
                <Check size={16} color={colors.success} />
              ) : (
                <AppText variant="label" color={colors.white}>
                  {busy === item._id ? '…' : 'Join'}
                </AppText>
              )}
            </Pressable>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            loading={isLoading}
            loadingLabel="Loading groups…"
            icon={<Users size={30} color={colors.brand} />}
            title="No travel groups yet"
            subtitle="Groups let you plan trips and split expenses together."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    ...shadow.sm,
  },
  groupThumb: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  groupImg: { width: '100%', height: '100%' },
  joinBtn: {
    paddingHorizontal: 18,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinedBtn: { backgroundColor: colors.greenSoft },
  empty: { paddingTop: spacing.huge, alignItems: 'center' },
});
