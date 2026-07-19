import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Heart, MessageCircle } from 'lucide-react-native';
import { AppText } from './ui/AppText';
import { colors } from '../theme/colors';
import { radius, shadow, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { toggleLike } from '../services/communityService';
import type { CommunityPost, PostAuthor } from '../types/community';

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function PostCard({ post, onPress }: { post: CommunityPost; onPress?: () => void }) {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;
  const author = (typeof post.userId === 'object' ? post.userId : undefined) as PostAuthor | undefined;
  const name = author?.username || author?.fullname || 'Traveler';

  const [likes, setLikes] = useState<string[]>(post.likes ?? []);
  const liked = uid ? likes.includes(uid) : false;

  const onLike = async () => {
    if (!uid) return;
    setLikes(prev => (liked ? prev.filter(x => x !== uid) : [...prev, uid]));
    try {
      const updated = await toggleLike(post._id, 'post');
      setLikes(updated);
    } catch {
      setLikes(prev => (liked ? [...prev, uid] : prev.filter(x => x !== uid)));
    }
  };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.head}>
        <View style={styles.avatar}>
          {author?.profilepicture ? (
            <Image source={{ uri: author.profilepicture }} style={styles.avatarImg} />
          ) : (
            <AppText variant="bodyStrong" color={colors.white}>
              {name.charAt(0).toUpperCase()}
            </AppText>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">{name}</AppText>
          <AppText variant="label" muted>
            {post.category ? `${post.category} · ` : ''}
            {timeAgo(post.createdAt)}
          </AppText>
        </View>
      </View>

      {post.title ? (
        <AppText variant="h3" style={styles.title}>
          {post.title}
        </AppText>
      ) : null}
      {post.content ? (
        <AppText variant="body" color={colors.ink700} numberOfLines={5} style={styles.content}>
          {post.content}
        </AppText>
      ) : null}

      {post.images && post.images.length > 0 ? (
        <Image source={{ uri: post.images[0] }} style={styles.media} resizeMode="cover" />
      ) : null}

      {post.tags && post.tags.length > 0 ? (
        <View style={styles.tags}>
          {post.tags.slice(0, 3).map(t => (
            <AppText key={t} variant="label" color={colors.brand}>
              #{t}{' '}
            </AppText>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={onLike} hitSlop={8}>
          <Heart
            size={19}
            color={liked ? colors.coral : colors.ink500}
            fill={liked ? colors.coral : 'transparent'}
          />
          <AppText variant="caption" muted>
            {likes.length}
          </AppText>
        </Pressable>
        <Pressable style={styles.action} onPress={onPress} hitSlop={8}>
          <MessageCircle size={19} color={colors.ink500} />
          <AppText variant="caption" muted>
            {post.repliesCount ?? 0}
          </AppText>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  pressed: { opacity: 0.96 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  title: { marginBottom: 4 },
  content: { lineHeight: 21 },
  media: {
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.md },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
