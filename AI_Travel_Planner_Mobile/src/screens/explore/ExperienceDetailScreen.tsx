import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bookmark, Heart, MapPin, Star } from 'lucide-react-native';
import { AppText } from '../../components/ui';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme';
import {
  getExperienceById,
  toggleExperienceLike,
  toggleExperienceSave,
} from '../../services/experiencesService';
import { useAuth } from '../../context/AuthContext';
import type { MainStackScreenProps } from '../../navigation/types';

const FALLBACK =
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1000&auto=format&fit=crop';

export function ExperienceDetailScreen({ navigation, route }: MainStackScreenProps<'ExperienceDetail'>) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;

  const { data } = useQuery({ queryKey: ['experience', id], queryFn: () => getExperienceById(id) });
  const exp: any = data;

  const [likes, setLikes] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);
  const likeList = likes ?? exp?.likes ?? [];
  const liked = uid ? likeList.includes(uid) : false;

  const onLike = async () => {
    if (!uid) return;
    setLikes(liked ? likeList.filter((x: string) => x !== uid) : [...likeList, uid]);
    try {
      await toggleExperienceLike(id);
    } catch {}
  };
  const onSave = async () => {
    setSaved(s => !s);
    try {
      await toggleExperienceSave(id);
    } catch {}
  };

  const author = exp && typeof exp.userId === 'object' ? exp.userId : undefined;
  const name = author?.username || author?.fullname || 'Traveler';

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={styles.hero}>
          <Image source={{ uri: exp?.images?.[0] || FALLBACK }} style={styles.heroImg} resizeMode="cover" />
          <SafeAreaView edges={['top']} style={styles.heroBar}>
            <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
              <ArrowLeft size={22} color={colors.white} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <AppText variant="h1">{exp?.title || 'Experience'}</AppText>
          <View style={styles.metaRow}>
            {exp?.location ? (
              <View style={styles.metaItem}>
                <MapPin size={15} color={colors.brand} />
                <AppText variant="caption" muted>
                  {exp.location}
                </AppText>
              </View>
            ) : null}
            {exp?.rating ? (
              <View style={styles.metaItem}>
                <Star size={15} color={colors.gold} fill={colors.gold} />
                <AppText variant="caption" muted>
                  {Number(exp.rating).toFixed(1)}
                </AppText>
              </View>
            ) : null}
          </View>

          <AppText variant="body" color={colors.ink700} style={styles.desc}>
            {exp?.description}
          </AppText>

          {exp?.images && exp.images.length > 1
            ? exp.images.slice(1).map((img: string, i: number) => (
                <Image key={i} source={{ uri: img }} style={styles.gallery} resizeMode="cover" />
              ))
            : null}

          {exp?.tags && exp.tags.length > 0 ? (
            <View style={styles.tags}>
              {exp.tags.map((t: string) => (
                <View key={t} style={styles.tag}>
                  <AppText variant="label" color={colors.ink600}>
                    #{t}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          <AppText variant="caption" muted style={{ marginTop: spacing.xl }}>
            Shared by {name}
          </AppText>
        </View>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable style={[styles.likeBtn, liked && styles.likeActive]} onPress={onLike}>
          <Heart size={20} color={liked ? colors.white : colors.coral} fill={liked ? colors.white : 'transparent'} />
          <AppText variant="button" color={liked ? colors.white : colors.coral}>
            {likeList.length}
          </AppText>
        </Pressable>
        <Pressable style={[styles.saveBtn, saved && styles.saveActive]} onPress={onSave}>
          <Bookmark size={20} color={colors.white} fill={saved ? colors.white : 'transparent'} />
          <AppText variant="button" color={colors.white}>
            {saved ? 'Saved' : 'Save'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  hero: { height: 300, backgroundColor: colors.surface },
  heroImg: { width: '100%', height: '100%' },
  heroBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    marginTop: -24,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
  },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  desc: { marginTop: spacing.lg, lineHeight: 23 },
  gallery: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.lg },
  tag: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  likeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.coralSoft,
  },
  likeActive: { backgroundColor: colors.coral },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
  saveActive: { backgroundColor: colors.brandDark },
});
