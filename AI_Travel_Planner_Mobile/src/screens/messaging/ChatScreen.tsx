import React, { useEffect, useRef, useState } from 'react';
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
import { ArrowLeft, MessageCircle, Send } from 'lucide-react-native';
import { AppText, EmptyState } from '../../components/ui';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { radius, spacing } from '../../theme';
import { getMessages, sendMessage, Message } from '../../services/messagingService';
import { useAuth } from '../../context/AuthContext';
import type { MainStackScreenProps } from '../../navigation/types';

export function ChatScreen({ navigation, route }: MainStackScreenProps<'Chat'>) {
  const { conversationId, title } = route.params;
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;
  const listRef = useRef<FlatList>(null);

  const { data } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId),
    refetchInterval: 5000,
  });

  const [local, setLocal] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const messages = [...(data ?? []), ...local];

  useEffect(() => {
    if (data) setLocal([]);
  }, [data]);

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    setText('');
    const optimistic: Message = {
      _id: `local_${Date.now()}`,
      content,
      senderFirebaseUid: uid,
      createdAt: new Date().toISOString(),
    };
    setLocal(prev => [...prev, optimistic]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    try {
      await sendMessage(conversationId, content);
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.ink800} />
        </Pressable>
        <AppText variant="h3" numberOfLines={1} style={{ flex: 1 }}>
          {title || 'Chat'}
        </AppText>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={8}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item, i) => item._id || String(i)}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const mine = item.senderFirebaseUid === uid;
            return (
              <View style={[styles.bubbleRow, mine ? styles.right : styles.left]}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <AppText variant="body" color={mine ? colors.white : colors.ink800}>
                    {item.content}
                  </AppText>
                </View>
              </View>
            );
          }}
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
            placeholder="Message…"
            placeholderTextColor={colors.ink400}
            value={text}
            onChangeText={setText}
            multiline
            selectionColor={colors.brand}
          />
          <Pressable
            style={[styles.send, !text.trim() && styles.sendDisabled]}
            onPress={send}
            disabled={!text.trim()}>
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
  list: { padding: spacing.xl, gap: spacing.sm, flexGrow: 1 },
  bubbleRow: { flexDirection: 'row' },
  right: { justifyContent: 'flex-end' },
  left: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg },
  mine: { backgroundColor: colors.brand, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
