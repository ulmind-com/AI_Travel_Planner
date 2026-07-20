import React, { useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MapPin, Plus, Users } from 'lucide-react-native';
import { Gradient } from '../../components/ui/Gradient';
import { AppText } from '../../components/ui';
import { PostCard } from '../../components/PostCard';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import {
  getEvents,
  getPosts,
  getStories,
  getTrendingPosts,
} from '../../services/communityService';
import type { CommunityEvent, Story } from '../../types/community';
import type { TabScreenProps } from '../../navigation/types';

type Feed = 'foryou' | 'trending';

export function CommunityScreen({ navigation }: TabScreenProps<'Community'>) {
  const [feed, setFeed] = useState<Feed>('foryou');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['community-feed', feed],
    queryFn: () => (feed === 'trending' ? getTrendingPosts() : getPosts()),
  });
  const { data: stories } = useQuery({ queryKey: ['stories'], queryFn: getStories });
  const { data: events } = useQuery({ queryKey: ['events'], queryFn: getEvents });

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
          ListHeaderComponent={
            <View>
              <StoriesRail stories={stories ?? []} onAdd={() => navigation.navigate('CreatePost')} />
              {feed === 'foryou' && (events ?? []).length > 0 ? (
                <EventsRail events={events ?? []} />
              ) : null}
            </View>
          }
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

function StoriesRail({ stories, onAdd }: { stories: Story[]; onAdd: () => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.stories}>
      <Pressable style={styles.storyItem} onPress={onAdd}>
        <View style={styles.addStory}>
          <Plus size={22} color={colors.brand} />
        </View>
        <AppText variant="label" muted numberOfLines={1}>
          Your story
        </AppText>
      </Pressable>
      {stories.map(s => {
        const author = typeof s.userId === 'object' ? s.userId : undefined;
        const name = author?.username || author?.fullname || 'Story';
        const img = (s as any).images?.[0] || s.image || s.mediaUrl;
        return (
          <Pressable key={s._id} style={styles.storyItem}>
            <Gradient colors={colors.brandGradient} style={styles.storyRing}>
              <View style={styles.storyInner}>
                {img ? (
                  <Image source={{ uri: img }} style={styles.storyImg} />
                ) : (
                  <AppText variant="bodyStrong" color={colors.white}>
                    {name.charAt(0).toUpperCase()}
                  </AppText>
                )}
              </View>
            </Gradient>
            <AppText variant="label" muted numberOfLines={1} style={{ maxWidth: 64 }}>
              {name}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function EventsRail({ events }: { events: CommunityEvent[] }) {
  return (
    <View style={styles.eventsWrap}>
      <AppText variant="h3" style={{ marginBottom: spacing.md }}>
        Upcoming events
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
        {events.map(e => (
          <View key={e._id} style={styles.eventCard}>
            <Gradient colors={['#7C6CF0', '#3A9BF0']} style={styles.eventThumb}>
              <CalendarDays size={22} color={colors.white} />
            </Gradient>
            <AppText variant="bodyStrong" numberOfLines={2} style={{ marginTop: spacing.sm }}>
              {e.title}
            </AppText>
            {e.location ? (
              <View style={styles.eventLoc}>
                <MapPin size={12} color={colors.ink400} />
                <AppText variant="label" muted numberOfLines={1}>
                  {e.location}
                </AppText>
              </View>
            ) : null}
            {e.date ? (
              <AppText variant="label" color={colors.brand}>
                {new Date(e.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </AppText>
            ) : null}
          </View>
        ))}
      </ScrollView>
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
  tabUnderline: { height: 3, borderRadius: 2, backgroundColor: colors.brand, marginTop: 6 },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 130 },
  stories: { gap: spacing.lg, paddingBottom: spacing.lg },
  storyItem: { alignItems: 'center', gap: 6, width: 68 },
  addStory: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.brandSoft,
    borderWidth: 1.5,
    borderColor: colors.brand,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRing: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  storyInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.white,
  },
  storyImg: { width: '100%', height: '100%' },
  eventsWrap: { marginBottom: spacing.xl },
  eventCard: {
    width: 160,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: 4,
    ...shadow.sm,
  },
  eventThumb: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  eventLoc: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
