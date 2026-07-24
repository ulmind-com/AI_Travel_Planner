import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, MapPin, MessageCircle, UserPlus } from 'lucide-react-native';
import { AppText, EmptyState } from '../../components/ui';
import { Gradient } from '../../components/ui/Gradient';
import { PostCard } from '../../components/PostCard';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import { getPublicProfile, toggleFollow } from '../../services/communityService';
import { getOrCreateConversation } from '../../services/messagingService';
import { useAuth } from '../../context/AuthContext';
import { tapMedium } from '../../lib/haptics';
import type { MainStackScreenProps } from '../../navigation/types';

export function PublicProfileScreen({ navigation, route }: MainStackScreenProps<'PublicProfile'>) {
  const { firebaseUid, name: nameParam } = route.params;
  const { firebaseUser } = useAuth();
  const isMe = firebaseUser?.uid === firebaseUid;

  const { data, isLoading } = useQuery({
    queryKey: ['public-profile', firebaseUid],
    queryFn: () => getPublicProfile(firebaseUid),
  });

  const p = data?.profile;
  const posts = data?.activity?.posts ?? [];
  const name = p?.username || p?.fullname || nameParam || 'Traveler';

  const [following, setFollowing] = useState<boolean | null>(null);
  const isFollowing = following ?? !!p?.isFollowing;

  const onFollow = async () => {
    tapMedium();
    setFollowing(!isFollowing);
    try {
      await toggleFollow(firebaseUid);
    } catch {
      setFollowing(isFollowing);
    }
  };

  const onMessage = async () => {
    try {
      const conv = await getOrCreateConversation(firebaseUid);
      navigation.navigate('Chat', {
        conversationId: conv._id,
        title: name,
        recipientFirebaseUid: firebaseUid,
      });
    } catch {}
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Cover / hero */}
        <View style={styles.cover}>
          {p?.coverImage ? (
            <Image source={{ uri: p.coverImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Gradient colors={colors.brandGradient} style={StyleSheet.absoluteFill} />
          )}
          <SafeAreaView edges={['top']} style={styles.coverBar}>
            <Pressable style={styles.glassBtn} onPress={() => navigation.goBack()} hitSlop={10}>
              <ArrowLeft size={21} color={colors.white} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <View style={styles.avatar}>
            {p?.profilepicture ? (
              <Image source={{ uri: p.profilepicture }} style={styles.avatarImg} />
            ) : (
              <AppText variant="hero" color={colors.white}>
                {name.charAt(0).toUpperCase()}
              </AppText>
            )}
          </View>

          <AppText variant="h1" center style={{ marginTop: spacing.md }}>
            {name}
          </AppText>
          {p?.country ? (
            <View style={styles.locRow}>
              <MapPin size={13} color={colors.ink400} />
              <AppText variant="caption" muted>
                {p.country}
              </AppText>
            </View>
          ) : null}
          {p?.bio ? (
            <AppText variant="body" muted center style={styles.bio}>
              {p.bio}
            </AppText>
          ) : null}

          {/* Stats */}
          <View style={styles.stats}>
            <Stat value={posts.length} label="Posts" />
            <View style={styles.statDivider} />
            <Stat value={p?.followersCount ?? 0} label="Followers" />
            <View style={styles.statDivider} />
            <Stat value={p?.followingCount ?? 0} label="Following" />
          </View>

          {/* Actions */}
          {!isMe ? (
            <View style={styles.actions}>
              <Pressable style={styles.followBtn} onPress={onFollow}>
                <Gradient
                  colors={isFollowing ? [colors.surface, colors.surface] : colors.brandGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.followInner}>
                  {isFollowing ? (
                    <Check size={18} color={colors.ink700} />
                  ) : (
                    <UserPlus size={18} color={colors.white} />
                  )}
                  <AppText variant="button" color={isFollowing ? colors.ink700 : colors.white}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </AppText>
                </Gradient>
              </Pressable>
              <Pressable style={styles.msgBtn} onPress={onMessage}>
                <MessageCircle size={20} color={colors.brand} />
              </Pressable>
            </View>
          ) : null}

          {/* Posts */}
          <AppText variant="h3" style={styles.sectionTitle}>
            {name.split(' ')[0]}'s posts
          </AppText>
          {posts.length === 0 ? (
            <EmptyState
              compact
              loading={isLoading}
              loadingLabel="Loading…"
              icon={<MessageCircle size={28} color={colors.brand} />}
              title="No posts yet"
              subtitle={`${name.split(' ')[0]} hasn't shared anything yet.`}
            />
          ) : (
            posts.map((post, i) => (
              <PostCard
                key={post._id ?? i}
                post={post}
                onPress={() => navigation.navigate('PostDetail', { post })}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="h2">{value}</AppText>
      <AppText variant="label" muted>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  cover: { height: 180, backgroundColor: colors.surface },
  coverBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  glassBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15,25,45,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: spacing.xl, alignItems: 'center', marginTop: -46 },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: colors.background,
  },
  avatarImg: { width: '100%', height: '100%' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  bio: { marginTop: spacing.md, paddingHorizontal: spacing.md },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignSelf: 'stretch',
    ...shadow.sm,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: colors.border },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, alignSelf: 'stretch' },
  followBtn: { flex: 1 },
  followInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: radius.pill,
  },
  msgBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { alignSelf: 'flex-start', marginTop: spacing.xxl, marginBottom: spacing.md },
});
