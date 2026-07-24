import React, { useEffect } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Lock, MessageSquarePlus } from 'lucide-react-native';
import { AppText, EmptyState } from '../../components/ui';
import { Gradient } from '../../components/ui/Gradient';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme';
import {
  getConversations,
  Conversation,
  ParticipantDetail,
  Message,
} from '../../services/messagingService';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import type { MainStackScreenProps } from '../../navigation/types';

function recipientOf(conv: Conversation, uid?: string): ParticipantDetail | undefined {
  if (conv.isGroup) return undefined;
  return (conv.participantDetails || []).find((p) => p.firebaseUid !== uid);
}

function titleFor(conv: Conversation, recipient?: ParticipantDetail): string {
  if (conv.isGroup) return conv.groupName || 'Group chat';
  return recipient?.fullname || recipient?.username || 'Conversation';
}

function preview(conv: Conversation): { text: string; encrypted: boolean } {
  const last = conv.lastMessage;
  if (!last) return { text: 'Say hello', encrypted: false };
  if (typeof last === 'string') return { text: last, encrypted: false };
  const m = last as Message;
  if (m.isEncrypted) return { text: 'Encrypted message', encrypted: true };
  return { text: m.content || '', encrypted: false };
}

export function ConversationsScreen({ navigation }: MainStackScreenProps<'Conversations'>) {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;
  const { socket, onlineUserIds } = useSocket();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  // Real-time: refresh previews/order when a new message arrives anywhere.
  useEffect(() => {
    if (!socket) return;
    const onChatMessage = (payload: any) => {
      if (payload?.type === 'messages:seen') return;
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };
    socket.on('chat:message', onChatMessage);
    return () => {
      socket.off('chat:message', onChatMessage);
    };
  }, [socket, queryClient]);

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
        keyExtractor={(item, i) => item._id ?? String(i)}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => {
          const recipient = recipientOf(item, uid);
          const title = titleFor(item, recipient);
          const { text: previewText, encrypted } = preview(item);
          const isOnline = !!recipient && onlineUserIds.has(recipient.firebaseUid);
          const avatarUrl = item.groupImage || recipient?.profilepicture;

          return (
            <Pressable
              style={styles.row}
              onPress={() =>
                navigation.navigate('Chat', {
                  conversationId: item._id,
                  title,
                  recipientFirebaseUid: recipient?.firebaseUid,
                  recipientAvatar: recipient?.profilepicture,
                })
              }>
              <View>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <Gradient colors={colors.brandGradient} style={styles.avatar}>
                    <AppText variant="h3" color={colors.white}>
                      {title.charAt(0).toUpperCase()}
                    </AppText>
                  </Gradient>
                )}
                {isOnline && <View style={styles.onlineDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {title}
                </AppText>
                <View style={styles.previewRow}>
                  {encrypted && <Lock size={11} color={colors.ink400} />}
                  <AppText variant="caption" muted numberOfLines={1} style={{ flex: 1 }}>
                    {previewText}
                  </AppText>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            loading={isLoading}
            loadingLabel="Loading messages…"
            icon={<MessageSquarePlus size={30} color={colors.brand} />}
            title="No messages yet"
            subtitle="Start a conversation from a traveler's profile or your friends list."
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
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.white,
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
});
