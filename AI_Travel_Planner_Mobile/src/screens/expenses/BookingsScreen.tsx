import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Hotel, Ticket } from 'lucide-react-native';
import { AppText, Card } from '../../components/ui';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import { getMyBookings } from '../../services/miscService';
import type { MainStackScreenProps } from '../../navigation/types';

export function BookingsScreen({ navigation }: MainStackScreenProps<'Bookings'>) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: getMyBookings,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.ink800} />
        </Pressable>
        <AppText variant="h3">My bookings</AppText>
        <View style={styles.circle} />
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(item, i) => item._id || String(i)}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <Card style={styles.card} rounded="xl">
            <View style={styles.icon}>
              <Hotel size={20} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {item.hotelName || item.title || item.name || 'Booking'}
              </AppText>
              <AppText variant="caption" muted numberOfLines={1}>
                {item.location || item.destination || ''}
                {item.checkIn ? ` · ${new Date(item.checkIn).toLocaleDateString()}` : ''}
              </AppText>
            </View>
            {item.status ? (
              <View style={styles.statusPill}>
                <AppText variant="label" color={colors.brandDark}>
                  {item.status}
                </AppText>
              </View>
            ) : null}
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ticket size={30} color={colors.ink300} />
            <AppText variant="h3" center style={{ marginTop: spacing.md }}>
              {isLoading ? 'Loading…' : 'No bookings yet'}
            </AppText>
            <AppText variant="body" muted center style={{ marginTop: 6 }}>
              Your hotel & trip bookings will appear here.
            </AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: { backgroundColor: colors.brandSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  empty: { paddingTop: spacing.huge, alignItems: 'center', paddingHorizontal: spacing.xl },
});
