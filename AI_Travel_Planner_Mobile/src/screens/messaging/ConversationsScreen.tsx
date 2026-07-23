import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageSquarePlus } from 'lucide-react-native';
import { AppText } from '../../components/ui';
import { Gradient } from '../../components/ui/Gradient';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme';
import { getConversations, Conversation } from '../../services/messagingService';
import { useAuth } from '../../context/AuthContext';
import type { MainStackScreenProps } from '../../navigation/types';

function titleFor(conv: Conversation, uid?: string): string {
  if (conv.isGroup) return conv.groupName || 'Group chat';
  const other = (conv.participants || []).find(
    (p: any) => (p?.firebaseUid || p) !== uid,
  );
  return other?.username || other?.fullname || 'Conversation';
}

function preview(conv: Conversation): string {
  if (!conv.lastMessage) return 'Say hello';
  return typeof conv.lastMessage === 'string' ? conv.lastMessage : conv.lastMessage.content || '';
}

export function ConversationsScreen({ navigation }: MainStackScreenProps<'Conversations'>) {
  const { firebaseUser } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.ink800} />
        </Pressable>
        <AppText variant="h3">Messages</AppText>
        <Pressable style={styles.circle} onPress={() => navigation.navigate('People')} hitSlop={10}>
          <MessageSquarePlus size={20} color={colors.brand} />
        </Pressable>
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => {
          const title = titleFor(item, firebaseUser?.uid);
          return (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('Chat', { conversationId: item._id, title })}>
              {item.groupImage ? (
                <Image source={{ uri: item.groupImage }} style={styles.avatar} />
              ) : (
                <Gradient colors={colors.brandGradient} style={styles.avatar}>
                  <AppText variant="h3" color={colors.white}>
                    {title.charAt(0).toUpperCase()}
                  </AppText>
                </Gradient>
              )}
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {title}
                </AppText>
                <AppText variant="caption" muted numberOfLines={1}>
                  {preview(item)}
                </AppText>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText variant="h3" center>
              {isLoading ? 'Loading…' : 'No messages yet'}
            </AppText>
            <AppText variant="body" muted center style={{ marginTop: 6 }}>
              Start a chat from a traveler's profile.
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
    gap: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  empty: { paddingTop: spacing.huge, alignItems: 'center', paddingHorizontal: spacing.xl },
});
