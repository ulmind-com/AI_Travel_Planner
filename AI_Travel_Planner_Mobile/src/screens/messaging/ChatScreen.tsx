import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { ArrowLeft, Check, CheckCheck, Lock, MessageCircle, Send } from 'lucide-react-native';
import { AppText, EmptyState } from '../../components/ui';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { radius, spacing } from '../../theme';
import {
  getMessages,
  sendMessage,
  markConversationRead,
  Message,
} from '../../services/messagingService';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useE2EE, DecryptableMessage } from '../../lib/e2ee/useE2EE';
import type { MainStackScreenProps } from '../../navigation/types';

function formatTime(dateString?: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatScreen({ navigation, route }: MainStackScreenProps<'Chat'>) {
  const { conversationId, title, recipientFirebaseUid } = route.params;
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;

  const { socket, onlineUserIds } = useSocket();
  const { isReady: e2eeReady, encrypt, decrypt, decryptBatch } = useE2EE(uid);

  const [messages, setMessages] = useState<DecryptableMessage[]>([]);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const listRef = useRef<FlatList>(null);
  const isOnline = !!recipientFirebaseUid && onlineUserIds.has(recipientFirebaseUid);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
  }, []);

  // ── Load history + mark read (re-runs once E2EE keys are ready) ──
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        markConversationRead(conversationId).catch(() => {});
        const history = await getMessages(conversationId);
        if (cancelled) return;

        const decorated = history.map((m) => ({
          ...m,
          _recipientFirebaseUid: recipientFirebaseUid,
        })) as DecryptableMessage[];

        if (e2eeReady) {
          const decrypted = await decryptBatch(decorated);
          if (!cancelled) setMessages(decrypted);
        } else {
          setMessages(
            decorated.map((m) => ({
              ...m,
              _displayContent: m.isEncrypted ? '🔒 Encrypted message' : m.content,
            })),
          );
        }
        scrollToEnd();
      } catch {
        // Network failure — keep whatever is on screen.
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [conversationId, e2eeReady, recipientFirebaseUid, decryptBatch, scrollToEnd]);

  // ── Real-time: incoming messages + seen receipts ──
  useEffect(() => {
    if (!socket) return;

    const onChatMessage = (data: any) => {
      if (!data) return;

      // Seen receipt → flip my messages to 'seen'
      if (data.type === 'messages:seen') {
        if (data.conversationId === conversationId) {
          setMessages((prev) =>
            prev.map((m) => (m.senderFirebaseUid === uid ? { ...m, status: 'seen' } : m)),
          );
        }
        return;
      }

      // Incoming message for this conversation
      if (data.conversationId === conversationId && data.message) {
        const process = async () => {
          const decorated: DecryptableMessage = {
            ...data.message,
            _recipientFirebaseUid: recipientFirebaseUid,
          };
          const displayContent =
            decorated.isEncrypted && e2eeReady ? await decrypt(decorated) : decorated.content;

          setMessages((prev) => {
            if (prev.some((m) => m._id === decorated._id)) return prev;
            return [...prev, { ...decorated, _displayContent: displayContent }];
          });
          scrollToEnd();
          // We're looking at this conversation → mark read immediately.
          markConversationRead(conversationId).catch(() => {});
        };
        process();
      }
    };

    socket.on('chat:message', onChatMessage);
    return () => {
      socket.off('chat:message', onChatMessage);
    };
  }, [socket, conversationId, recipientFirebaseUid, e2eeReady, decrypt, uid, scrollToEnd]);

  const send = async () => {
    const originalText = text.trim();
    if (!originalText || isSending) return;
    setText('');
    setIsSending(true);

    try {
      let payload: { content: string; nonce?: string; isEncrypted: boolean } = {
        content: originalText,
        isEncrypted: false,
      };

      if (e2eeReady && recipientFirebaseUid) {
        const enc = await encrypt(originalText, recipientFirebaseUid);
        payload = { content: enc.content, nonce: enc.nonce, isEncrypted: enc.isEncrypted };
      }

      const saved = await sendMessage(conversationId, payload.content, {
        nonce: payload.nonce,
        isEncrypted: payload.isEncrypted,
      });

      const displayMsg: DecryptableMessage = {
        ...saved,
        _recipientFirebaseUid: recipientFirebaseUid,
        _displayContent: originalText,
        _decryptedContent: originalText,
      };

      setMessages((prev) =>
        prev.some((m) => m._id === saved._id) ? prev : [...prev, displayMsg],
      );
      scrollToEnd();
    } catch {
      setText(originalText); // rollback on failure
    } finally {
      setIsSending(false);
    }
  };

  const renderTicks = (status?: Message['status']) => {
    if (status === 'seen') return <CheckCheck size={14} color={colors.green} />;
    if (status === 'delivered') return <CheckCheck size={14} color={colors.ink400} />;
    return <Check size={14} color={colors.ink400} />;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.ink800} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="h3" numberOfLines={1}>
            {title || 'Chat'}
          </AppText>
          <View style={styles.statusRow}>
            {isOnline && <View style={styles.onlineDot} />}
            <AppText variant="caption" color={isOnline ? colors.green : colors.ink400}>
              {isOnline ? 'Online' : 'Offline'}
            </AppText>
          </View>
        </View>
        <View style={styles.lockPill}>
          <Lock size={12} color={colors.green} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item, i) => item._id || String(i)}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const mine = item.senderFirebaseUid === uid;
            const content = item._displayContent ?? item.content;
            return (
              <View style={[styles.bubbleRow, mine ? styles.right : styles.left]}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <AppText variant="body" color={mine ? colors.white : colors.ink800}>
                    {content}
                  </AppText>
                  <View style={styles.metaRow}>
                    <AppText
                      variant="caption"
                      color={mine ? 'rgba(255,255,255,0.7)' : colors.ink400}
                      style={styles.timeText}>
                      {formatTime(item.createdAt)}
                    </AppText>
                    {mine && renderTicks(item.status)}
                  </View>
                </View>
              </View>
            );
          }}
          ListHeaderComponent={
            <View style={styles.e2eeBanner}>
              <Lock size={11} color={colors.green} />
              <AppText variant="caption" color={colors.ink500} style={styles.e2eeText}>
                Messages are end-to-end encrypted
              </AppText>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              compact
              icon={<MessageCircle size={30} color={colors.brand} />}
              title="Say hello"
              subtitle="This is the start of your conversation."
            />
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={e2eeReady ? 'End-to-end encrypted message…' : 'Message…'}
            placeholderTextColor={colors.ink400}
            value={text}
            onChangeText={setText}
            multiline
            selectionColor={colors.brand}
          />
          <Pressable
            style={[styles.send, (!text.trim() || isSending) && styles.sendDisabled]}
            onPress={send}
            disabled={!text.trim() || isSending}>
            <Send size={18} color={colors.white} />
          </Pressable>
        </View>
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
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
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
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  lockPill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: spacing.xl, gap: spacing.sm, flexGrow: 1 },
  e2eeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.greenSoft,
    marginBottom: spacing.md,
  },
  e2eeText: { fontSize: 11 },
  bubbleRow: { flexDirection: 'row' },
  right: { justifyContent: 'flex-end' },
  left: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.lg },
  mine: { backgroundColor: colors.brand, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 },
  timeText: { fontSize: 10 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 46,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink900,
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: colors.ink300 },
});
