import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, Users } from 'lucide-react-native';
import { AppText, EmptyState } from '../../components/ui';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme';
import { getFriends } from '../../services/socialService';
import { getOrCreateConversation } from '../../services/messagingService';
import type { MainStackScreenProps } from '../../navigation/types';

export function FriendsScreen({ navigation }: MainStackScreenProps<'Friends'>) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
  });

  const message = async (firebaseUid?: string, name?: string) => {
    if (!firebaseUid) return;
    try {
      const conv = await getOrCreateConversation(firebaseUid);
      navigation.navigate('Chat', { conversationId: conv._id, title: name });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.ink800} />
        </Pressable>
        <AppText variant="h3">Friends</AppText>
        <View style={styles.circle} />
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(item, i) => item.firebaseUid || item._id || String(i)}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => {
          const name = item.username || item.fullname || 'Traveler';
          return (
            <View style={styles.row}>
              <View style={styles.avatar}>
                {item.profilepicture || item.profileImage ? (
                  <Image source={{ uri: item.profilepicture || item.profileImage }} style={styles.avatarImg} />
                ) : (
                  <AppText variant="bodyStrong" color={colors.white}>
                    {name.charAt(0).toUpperCase()}
                  </AppText>
                )}
              </View>
              <AppText variant="bodyStrong" style={{ flex: 1 }}>
                {name}
              </AppText>
              <Pressable style={styles.msgBtn} onPress={() => message(item.firebaseUid, name)}>
                <MessageCircle size={18} color={colors.brand} />
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            loading={isLoading}
            loadingLabel="Loading friends…"
            icon={<Users size={30} color={colors.purple} />}
            gradient={[colors.purpleSoft, colors.sky100]}
            title="No friends yet"
            subtitle="Find fellow travelers and connect from the search screen."
          />
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: spacing.md },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  msgBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { paddingTop: spacing.huge, alignItems: 'center', paddingHorizontal: spacing.xl },
});
