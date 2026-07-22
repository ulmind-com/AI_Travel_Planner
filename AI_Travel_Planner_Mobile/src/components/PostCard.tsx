import React, { useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react-native';
import { Gradient } from './ui/Gradient';
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
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function PostCard({ post, onPress }: { post: CommunityPost; onPress?: () => void }) {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;
  const author = (typeof post.userId === 'object' ? post.userId : undefined) as PostAuthor | undefined;
  const name = author?.username || author?.fullname || 'Traveler';

  const [likes, setLikes] = useState<string[]>(post.likes ?? []);
  const liked = uid ? likes.includes(uid) : false;
  const heart = useRef(new Animated.Value(1)).current;

  const onLike = async () => {
    if (!uid) return;
    Animated.sequence([
      Animated.spring(heart, { toValue: 1.35, useNativeDriver: true, speed: 50 }),
      Animated.spring(heart, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    setLikes(prev => (liked ? prev.filter(x => x !== uid) : [...prev, uid]));
    try {
      setLikes(await toggleLike(post._id, 'post'));
    } catch {
      setLikes(prev => (liked ? [...prev, uid] : prev.filter(x => x !== uid)));
    }
  };

  const images = post.images ?? [];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {/* Author */}
      <View style={styles.head}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            {author?.profilepicture ? (
              <Image source={{ uri: author.profilepicture }} style={styles.avatarImg} />
            ) : (
              <AppText variant="bodyStrong" color={colors.white}>
                {name.charAt(0).toUpperCase()}
              </AppText>
            )}
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {name}
          </AppText>
          <AppText variant="label" muted>
            {timeAgo(post.createdAt)}
          </AppText>
        </View>
        {post.category ? (
          <View style={styles.categoryPill}>
            <AppText variant="label" color={colors.brandDark}>
              {post.category}
            </AppText>
          </View>
        ) : (
          <MoreHorizontal size={18} color={colors.ink300} />
        )}
      </View>

      {/* Text */}
      <View style={styles.textWrap}>
        {post.title ? (
          <AppText variant="h3" numberOfLines={2} style={{ marginBottom: 4 }}>
            {post.title}
          </AppText>
        ) : null}
        {post.content ? (
          <AppText variant="body" color={colors.ink700} numberOfLines={4} style={styles.content}>
            {post.content}
          </AppText>
        ) : null}
      </View>

      {/* Media */}
      {images.length === 1 ? (
        <Image source={{ uri: images[0] }} style={styles.single} resizeMode="cover" />
      ) : images.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mediaRow}>
          {images.map((img, i) => (
            <View key={i} style={styles.multiWrap}>
              <Image source={{ uri: img }} style={styles.multi} resizeMode="cover" />
              <View style={styles.countPill}>
                <AppText variant="label" color={colors.white}>
                  {i + 1}/{images.length}
                </AppText>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {/* Tags */}
      {post.tags && post.tags.length > 0 ? (
        <View style={styles.tags}>
          {post.tags.slice(0, 4).map(t => (
            <View key={t} style={styles.tag}>
              <AppText variant="label" color={colors.brand}>
                #{t}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={onLike} hitSlop={8}>
          <Animated.View style={{ transform: [{ scale: heart }] }}>
            <Heart
              size={19}
              color={liked ? colors.coral : colors.ink500}
              fill={liked ? colors.coral : 'transparent'}
            />
          </Animated.View>
          <AppText variant="caption" color={liked ? colors.coral : colors.ink500}>
            {likes.length}
          </AppText>
        </Pressable>

        <Pressable style={styles.action} onPress={onPress} hitSlop={8}>
          <MessageCircle size={19} color={colors.ink500} />
          <AppText variant="caption" muted>
            {post.repliesCount ?? 0}
          </AppText>
        </Pressable>

        <View style={{ flex: 1 }} />
        <Gradient colors={colors.brandGradient} style={styles.readMore}>
          <AppText variant="label" color={colors.white}>
            Read
          </AppText>
        </Gradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadow.card,
  },
  pressed: { opacity: 0.97 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: colors.brandSoft,
  },
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
  categoryPill: {
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  textWrap: { paddingHorizontal: spacing.lg },
  content: { lineHeight: 21 },
  single: {
    width: '100%',
    height: 230,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
  },
  mediaRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.md },
  multiWrap: { borderRadius: radius.lg, overflow: 'hidden' },
  multi: { width: 230, height: 180, backgroundColor: colors.surface },
  countPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(10,16,30,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  tag: {
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  readMore: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: radius.pill },
});
