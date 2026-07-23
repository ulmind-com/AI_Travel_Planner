import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';

/** Curated, reliable travel photos used when a plan/experience has no usable image. */
const FALLBACKS = [
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4',
];

const Q = '?w=1000&auto=format&fit=crop&q=80';

function seedIndex(seed?: string): number {
  if (!seed) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % FALLBACKS.length;
}

function fallbackFor(seed?: string): string {
  return FALLBACKS[seedIndex(seed)] + Q;
}

function isHttp(u?: string): boolean {
  return !!u && /^https?:\/\//i.test(u.trim());
}

interface Props {
  uri?: string;
  /** deterministic fallback picker (e.g. destination name) */
  seed?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain';
}

/**
 * Remote image that never leaves an empty grey box: shows a spinner while
 * loading and swaps to a curated travel photo if the source is missing or
 * fails to load.
 */
export function SmartImage({ uri, seed, style, imageStyle, resizeMode = 'cover' }: Props) {
  const primary = useMemo(() => (isHttp(uri) ? uri!.trim() : fallbackFor(seed)), [uri, seed]);
  const [src, setSrc] = useState(primary);
  const [loading, setLoading] = useState(true);
  const [triedFallback, setTriedFallback] = useState(!isHttp(uri));

  // Reset when the incoming uri changes (list recycling).
  const [lastPrimary, setLastPrimary] = useState(primary);
  if (primary !== lastPrimary) {
    setLastPrimary(primary);
    setSrc(primary);
    setLoading(true);
    setTriedFallback(!isHttp(uri));
  }

  return (
    <View style={[styles.wrap, style]}>
      <Image
        source={{ uri: src }}
        style={[StyleSheet.absoluteFill, imageStyle]}
        resizeMode={resizeMode}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          if (!triedFallback) {
            setTriedFallback(true);
            setSrc(fallbackFor(seed));
          } else {
            setLoading(false);
          }
        }}
      />
      {loading ? (
        <View style={styles.center} pointerEvents="none">
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.surface, overflow: 'hidden' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
