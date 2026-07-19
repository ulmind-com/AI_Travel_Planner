import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Gradient as LinearGradient } from './ui/Gradient';
import { Heart, MapPin, Star } from 'lucide-react-native';
import { AppText } from './ui/AppText';
import { colors } from '../theme/colors';
import { radius, shadow, spacing } from '../theme';
import type { Experience } from '../services/experiencesService';

const FALLBACK =
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1000&auto=format&fit=crop';

export function ExperienceCard({ item, onPress }: { item: Experience; onPress?: () => void }) {
  const author = typeof item.userId === 'object' ? item.userId : undefined;
  const name = author?.username || author?.fullname || 'Traveler';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imgWrap}>
        <Image source={{ uri: item.images?.[0] || FALLBACK }} style={styles.img} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(10,16,30,0.65)']} style={styles.shade} />
        {item.location ? (
          <View style={styles.loc}>
            <MapPin size={13} color={colors.white} />
            <AppText variant="label" color={colors.white} numberOfLines={1}>
              {item.location}
            </AppText>
          </View>
        ) : null}
        {typeof item.rating === 'number' && item.rating > 0 ? (
          <View style={styles.rating}>
            <Star size={12} color={colors.gold} fill={colors.gold} />
            <AppText variant="label" color={colors.ink800}>
              {item.rating.toFixed(1)}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <AppText variant="h3" numberOfLines={1}>
          {item.title || 'Untitled experience'}
        </AppText>
        {item.description ? (
          <AppText variant="caption" muted numberOfLines={2} style={{ marginTop: 4 }}>
            {item.description}
          </AppText>
        ) : null}
        <View style={styles.foot}>
          <AppText variant="label" muted>
            by {name}
          </AppText>
          <View style={styles.likes}>
            <Heart size={14} color={colors.coral} fill={colors.coral} />
            <AppText variant="label" muted>
              {item.likes?.length ?? 0}
            </AppText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  pressed: { opacity: 0.96 },
  imgWrap: { height: 180, backgroundColor: colors.surface },
  img: { width: '100%', height: '100%' },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 80 },
  loc: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '70%',
  },
  rating: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  body: { padding: spacing.lg },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  likes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
