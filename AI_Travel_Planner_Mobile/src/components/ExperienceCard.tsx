import React, { useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import { Heart, MapPin, Star } from 'lucide-react-native';
import { Gradient } from './ui/Gradient';
import { SmartImage } from './ui/SmartImage';
import { AppText } from './ui/AppText';
import { colors } from '../theme/colors';
import { radius, shadow, spacing } from '../theme';
import { cleanTitle } from '../lib/text';
import type { Experience } from '../services/experiencesService';

export function ExperienceCard({ item, onPress }: { item: Experience; onPress?: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const author = typeof item.userId === 'object' ? item.userId : undefined;
  const name = author?.username || author?.fullname || 'Traveler';
  const photos = item.images?.length ?? 0;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={styles.card}>
        <View style={styles.imgWrap}>
          <SmartImage uri={item.images?.[0]} seed={item.title || item.location} style={StyleSheet.absoluteFill} />
          <Gradient
            colors={['rgba(8,14,28,0.15)', 'rgba(8,14,28,0.02)', 'rgba(8,14,28,0.85)']}
            style={StyleSheet.absoluteFill}
          />

          {typeof item.rating === 'number' && item.rating > 0 ? (
            <View style={styles.rating}>
              <Star size={12} color={colors.gold} fill={colors.gold} />
              <AppText variant="label" color={colors.ink900}>
                {item.rating.toFixed(1)}
              </AppText>
            </View>
          ) : null}

          {photos > 1 ? (
            <View style={styles.photoCount}>
              <AppText variant="label" color={colors.white}>
                {photos} photos
              </AppText>
            </View>
          ) : null}

          <View style={styles.imgFoot}>
            <AppText variant="h3" color={colors.white} numberOfLines={2}>
              {cleanTitle(item.title, 'Untitled experience')}
            </AppText>
            {item.location ? (
              <View style={styles.locRow}>
                <MapPin size={12} color="rgba(255,255,255,0.9)" />
                <AppText variant="caption" color="rgba(255,255,255,0.9)" numberOfLines={1}>
                  {item.location}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          {item.description ? (
            <AppText variant="caption" muted numberOfLines={2} style={styles.desc}>
              {item.description}
            </AppText>
          ) : null}

          <View style={styles.foot}>
            <View style={styles.authorRow}>
              <View style={styles.avatar}>
                {author?.profilepicture ? (
                  <Image source={{ uri: author.profilepicture }} style={styles.avatarImg} />
                ) : (
                  <AppText variant="label" color={colors.white}>
                    {name.charAt(0).toUpperCase()}
                  </AppText>
                )}
              </View>
              <AppText variant="label" muted numberOfLines={1}>
                {name}
              </AppText>
            </View>

            <View style={styles.likes}>
              <Heart size={13} color={colors.coral} fill={colors.coral} />
              <AppText variant="label" color={colors.ink600}>
                {item.likes?.length ?? 0}
              </AppText>
            </View>
          </View>

          {item.tags && item.tags.length > 0 ? (
            <View style={styles.tags}>
              {item.tags.slice(0, 3).map(t => (
                <View key={t} style={styles.tag}>
                  <AppText variant="label" color={colors.brand}>
                    #{t}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  imgWrap: { height: 220, backgroundColor: colors.surface },
  img: { width: '100%', height: '100%' },
  rating: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    ...shadow.sm,
  },
  photoCount: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(10,16,30,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  imgFoot: { position: 'absolute', left: 16, right: 16, bottom: 14 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  body: { padding: spacing.lg },
  desc: { lineHeight: 19, marginBottom: spacing.md },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  likes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.coralSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  tag: {
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
});
