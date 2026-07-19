import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bell, CheckCheck, Heart, MessageCircle, UserPlus } from 'lucide-react-native';
import { AppText } from '../../components/ui';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  Notification,
} from '../../services/socialService';
import { queryClient } from '../../lib/queryClient';
import type { MainStackScreenProps } from '../../navigation/types';

function iconFor(type?: string) {
  if (type?.includes('like')) return { Icon: Heart, tint: colors.coral };
  if (type?.includes('follow') || type?.includes('friend')) return { Icon: UserPlus, tint: colors.brand };
  if (type?.includes('comment') || type?.includes('message')) return { Icon: MessageCircle, tint: colors.purple };
  return { Icon: Bell, tint: colors.gold };
}

export function NotificationsScreen({ navigation }: MainStackScreenProps<'Notifications'>) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {}
  };

  const open = async (n: Notification) => {
    if (!(n.read ?? n.isRead)) {
      try {
        await markNotificationRead(n._id);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch {}
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.ink800} />
        </Pressable>
        <AppText variant="h3">Notifications</AppText>
        <Pressable style={styles.circle} onPress={markAll} hitSlop={10}>
          <CheckCheck size={20} color={colors.brand} />
        </Pressable>
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(item, i) => item._id || String(i)}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => {
          const { Icon, tint } = iconFor(item.type);
          const unread = !(item.read ?? item.isRead);
          return (
            <Pressable style={[styles.row, unread && styles.unread]} onPress={() => open(item)}>
              <View style={[styles.iconWrap, { backgroundColor: tint + '1A' }]}>
                <Icon size={18} color={tint} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="body" color={colors.ink800}>
                  {item.message || item.content || 'New notification'}
                </AppText>
              </View>
              {unread ? <View style={styles.dot} /> : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Bell size={30} color={colors.ink300} />
            <AppText variant="h3" center style={{ marginTop: spacing.md }}>
              {isLoading ? 'Loading…' : 'No notifications'}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  unread: { backgroundColor: colors.brandSoft },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand },
  empty: { paddingTop: spacing.huge, alignItems: 'center' },
});
