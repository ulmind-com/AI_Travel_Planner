import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Star, X } from 'lucide-react-native';
import { AppText, Button, Card } from '../../components/ui';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { radius, shadow, spacing } from '../../theme';
import { createReview, getReviews } from '../../services/miscService';
import { useAuth } from '../../context/AuthContext';
import { queryClient } from '../../lib/queryClient';
import type { MainStackScreenProps } from '../../navigation/types';

export function ReviewsScreen({ navigation }: MainStackScreenProps<'Reviews'>) {
  const { profile } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['reviews'],
    queryFn: getReviews,
  });

  const [composing, setComposing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [location, setLocation] = useState('');
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await createReview({
        userName: profile?.username || profile?.fullname || 'Traveler',
        location: location.trim() || undefined,
        rating,
        comment: comment.trim(),
      });
      setComment('');
      setLocation('');
      setRating(5);
      setComposing(false);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    } catch {
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.ink800} />
        </Pressable>
        <AppText variant="h3">Reviews</AppText>
        <Pressable style={styles.circle} onPress={() => setComposing(c => !c)} hitSlop={10}>
          {composing ? <X size={20} color={colors.ink600} /> : <Plus size={20} color={colors.brand} />}
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={data ?? []}
          keyExtractor={(item, i) => item._id || String(i)}
          contentContainerStyle={styles.list}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={
            composing ? (
              <Card style={styles.composer} rounded="xl">
                <AppText variant="label" color={colors.ink600} style={styles.lbl}>
                  YOUR RATING
                </AppText>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <Pressable key={n} onPress={() => setRating(n)} hitSlop={6}>
                      <Star size={30} color={colors.gold} fill={n <= rating ? colors.gold : 'transparent'} />
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Location (optional)"
                  placeholderTextColor={colors.ink400}
                  value={location}
                  onChangeText={setLocation}
                />
                <TextInput
                  style={styles.textarea}
                  placeholder="Share your experience…"
                  placeholderTextColor={colors.ink400}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                />
                <Button label="Post review" size="md" loading={posting} onPress={submit} />
              </Card>
            ) : null
          }
          renderItem={({ item }) => (
            <Card style={styles.review} rounded="xl">
              <View style={styles.reviewHead}>
                <View style={styles.avatar}>
                  <AppText variant="bodyStrong" color={colors.white}>
                    {(item.userName || 'T').charAt(0).toUpperCase()}
                  </AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">{item.userName || 'Traveler'}</AppText>
                  {item.location ? (
                    <AppText variant="label" muted>
                      {item.location}
                    </AppText>
                  ) : null}
                </View>
                <View style={styles.ratingPill}>
                  <Star size={12} color={colors.gold} fill={colors.gold} />
                  <AppText variant="label" color={colors.ink700}>
                    {item.rating ?? 5}
                  </AppText>
                </View>
              </View>
              <AppText variant="body" color={colors.ink700} style={{ marginTop: spacing.sm }}>
                {item.comment}
              </AppText>
            </Card>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <AppText variant="body" muted center>
                {isLoading ? 'Loading reviews…' : 'No reviews yet. Be the first!'}
              </AppText>
            </View>
          }
        />
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
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  composer: { backgroundColor: colors.white, gap: spacing.md, marginBottom: spacing.lg, ...shadow.sm },
  lbl: { letterSpacing: 1 },
  stars: { flexDirection: 'row', gap: spacing.sm },
  input: {
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink900,
  },
  textarea: {
    minHeight: 90,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink900,
    textAlignVertical: 'top',
  },
  review: { backgroundColor: colors.white, marginBottom: spacing.md, ...shadow.sm },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  empty: { paddingTop: spacing.huge, alignItems: 'center' },
});
