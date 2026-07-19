import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart, Send } from 'lucide-react-native';
import { AppText } from '../../components/ui';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { radius, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { addComment, getPostById, toggleLike } from '../../services/communityService';
import type { Comment, PostAuthor } from '../../types/community';
import type { MainStackScreenProps } from '../../navigation/types';

export function PostDetailScreen({ navigation, route }: MainStackScreenProps<'PostDetail'>) {
  const { post: initial } = route.params;
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;

  const { data, refetch } = useQuery({
    queryKey: ['post', initial._id],
    queryFn: () => getPostById(initial._id),
    initialData: initial as any,
  });
  const post: any = data ?? initial;
  const comments: Comment[] = post?.comments ?? [];

  const [likes, setLikes] = useState<string[]>(initial.likes ?? []);
  const liked = uid ? likes.includes(uid) : false;
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const author = (typeof post.userId === 'object' ? post.userId : undefined) as PostAuthor | undefined;
  const name = author?.username || author?.fullname || 'Traveler';

  const onLike = async () => {
    if (!uid) return;
    setLikes(prev => (liked ? prev.filter(x => x !== uid) : [...prev, uid]));
    try {
      setLikes(await toggleLike(post._id, 'post'));
    } catch {}
  };

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await addComment(post._id, text.trim());
      setText('');
      refetch();
    } catch {
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.ink800} />
        </Pressable>
        <AppText variant="h3">Post</AppText>
        <View style={styles.circle} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.authorRow}>
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
              {post.category ? (
                <AppText variant="label" muted>
                  {post.category}
                </AppText>
              ) : null}
            </View>
          </View>

          {post.title ? <AppText variant="h2" style={styles.title}>{post.title}</AppText> : null}
          <AppText variant="body" color={colors.ink700} style={styles.body}>
            {post.content}
          </AppText>

          {post.images && post.images.length > 0
            ? post.images.map((img: string, i: number) => (
                <Image key={i} source={{ uri: img }} style={styles.media} resizeMode="cover" />
              ))
            : null}

          <View style={styles.likeRow}>
            <Pressable style={styles.likeBtn} onPress={onLike}>
              <Heart
                size={20}
                color={liked ? colors.coral : colors.ink500}
                fill={liked ? colors.coral : 'transparent'}
              />
              <AppText variant="bodyStrong" color={liked ? colors.coral : colors.ink600}>
                {likes.length} {likes.length === 1 ? 'like' : 'likes'}
              </AppText>
            </Pressable>
          </View>

          <View style={styles.divider} />
          <AppText variant="h3" style={styles.commentsTitle}>
            Comments {comments.length ? `(${comments.length})` : ''}
          </AppText>

          {comments.length === 0 ? (
            <AppText variant="body" muted style={{ marginTop: spacing.md }}>
              No comments yet. Start the conversation.
            </AppText>
          ) : (
            comments.map(c => {
              const ca = (typeof c.userId === 'object' ? c.userId : undefined) as PostAuthor | undefined;
              const cname = ca?.username || ca?.fullname || 'Traveler';
              return (
                <View key={c._id} style={styles.comment}>
                  <View style={styles.commentAvatar}>
                    <AppText variant="label" color={colors.white}>
                      {cname.charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                  <View style={styles.commentBody}>
                    <AppText variant="bodyStrong">{cname}</AppText>
                    <AppText variant="body" color={colors.ink700}>
                      {c.content}
                    </AppText>
                  </View>
                </View>
              );
            })
          )}
          <View style={{ height: spacing.xxl }} />
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment…"
            placeholderTextColor={colors.ink400}
            value={text}
            onChangeText={setText}
            selectionColor={colors.brand}
          />
          <Pressable
            style={[styles.send, (!text.trim() || sending) && styles.sendDisabled]}
            onPress={send}
            disabled={!text.trim() || sending}>
            <Send size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
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
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  title: { marginTop: spacing.lg },
  body: { marginTop: spacing.md, lineHeight: 23 },
  media: {
    width: '100%',
    height: 240,
    borderRadius: radius.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
  },
  likeRow: { marginTop: spacing.lg },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.xl },
  commentsTitle: {},
  comment: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentBody: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    height: 46,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink900,
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: colors.ink300 },
});
