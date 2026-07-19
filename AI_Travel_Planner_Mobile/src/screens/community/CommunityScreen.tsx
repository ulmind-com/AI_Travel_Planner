import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react-native';
import { AppText } from '../../components/ui';
import { PostCard } from '../../components/PostCard';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import { getPosts, getTrendingPosts } from '../../services/communityService';
import type { TabScreenProps } from '../../navigation/types';

type Feed = 'foryou' | 'trending';

export function CommunityScreen({ navigation }: TabScreenProps<'Community'>) {
  const [feed, setFeed] = useState<Feed>('foryou');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['community-feed', feed],
    queryFn: () => (feed === 'trending' ? getTrendingPosts() : getPosts()),
  });

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <AppText variant="h1">Community</AppText>
          <Pressable style={styles.groupsBtn} onPress={() => navigation.navigate('Groups')}>
            <Users size={20} color={colors.brand} />
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {(['foryou', 'trending'] as Feed[]).map(f => (
            <Pressable key={f} onPress={() => setFeed(f)} style={styles.tab}>
              <AppText variant="bodyStrong" color={feed === f ? colors.ink900 : colors.ink400}>
                {f === 'foryou' ? 'For you' : 'Trending'}
              </AppText>
              {feed === f ? <View style={styles.tabUnderline} /> : null}
            </Pressable>
          ))}
        </View>

        <FlatList
          data={data ?? []}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <PostCard post={item} onPress={() => navigation.navigate('PostDetail', { post: item })} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <AppText variant="h3" center>
                {isLoading ? 'Loading community…' : 'No posts yet'}
              </AppText>
              {!isLoading ? (
                <AppText variant="body" muted center style={{ marginTop: 6 }}>
                  Be the first to share your travel story.
                </AppText>
              ) : null}
            </View>
          }
        />
      </SafeAreaView>

      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreatePost')}>
        <Plus size={26} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  groupsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: { flexDirection: 'row', gap: spacing.xl, paddingHorizontal: spacing.xl, marginTop: spacing.md },
  tab: { paddingVertical: spacing.sm },
  tabUnderline: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.brand,
    marginTop: 6,
  },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 130 },
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
