import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Lightbulb, MapPin, Send, Sparkles, Trash2 } from 'lucide-react-native';
import { AppText } from '../../components/ui';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { radius, shadow, spacing } from '../../theme';
import { clearChatHistory, getChatHistory, sendChatMessage } from '../../services/aiService';
import type { ChatMessage, ChatReply } from '../../types/chat';
import type { MainStackScreenProps } from '../../navigation/types';

interface Bubble extends ChatMessage {
  reply?: ChatReply;
  pending?: boolean;
}

const STARTERS = [
  'Plan a 5-day trip to Bali on a mid budget',
  'Best time to visit Iceland?',
  'Cheap weekend getaways from Delhi',
  'Suggest a romantic honeymoon destination',
];

export function AIChatScreen({ navigation }: MainStackScreenProps<'AIChat'>) {
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    getChatHistory()
      .then(h => setMessages(h.map(m => ({ ...m }))))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  const scrollEnd = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || sending) return;
    setInput('');
    setFollowUps([]);
    setMessages(prev => [
      ...prev,
      { role: 'user', content: msg },
      { role: 'assistant', content: '', pending: true },
    ]);
    setSending(true);
    scrollEnd();
    try {
      const reply = await sendChatMessage(msg);
      setMessages(prev => {
        const next = [...prev];
        const idx = next.map(m => m.pending).lastIndexOf(true);
        if (idx >= 0) {
          next[idx] = {
            role: 'assistant',
            content: reply.aiResponse?.message || 'Here are some ideas for you.',
            reply,
          };
        }
        return next;
      });
      setFollowUps(reply.followUps ?? []);
    } catch (e) {
      setMessages(prev => {
        const next = [...prev];
        const idx = next.map(m => m.pending).lastIndexOf(true);
        if (idx >= 0)
          next[idx] = {
            role: 'assistant',
            content: 'Sorry, I had trouble responding. Please try again.',
          };
        return next;
      });
    } finally {
      setSending(false);
      scrollEnd();
    }
  };

  const clear = async () => {
    setMessages([]);
    setFollowUps([]);
    try {
      await clearChatHistory();
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.ink800} />
        </Pressable>
        <View style={styles.headerTitle}>
          <View style={styles.aiDot}>
            <Sparkles size={16} color={colors.white} />
          </View>
          <View>
            <AppText variant="h3">AI Assistant</AppText>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <AppText variant="label" color={colors.success}>
                Online
              </AppText>
            </View>
          </View>
        </View>
        {messages.length > 0 ? (
          <Pressable style={styles.circle} onPress={clear} hitSlop={10}>
            <Trash2 size={18} color={colors.ink600} />
          </Pressable>
        ) : (
          <View style={styles.circle} />
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}>
        {loadingHistory ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : messages.length === 0 ? (
          <EmptyState onPick={send} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <MessageBubble bubble={item} />}
            onContentSizeChange={scrollEnd}
            showsVerticalScrollIndicator={false}
          />
        )}

        {followUps.length > 0 && !sending ? (
          <View style={styles.followRow}>
            <FlatList
              horizontal
              data={followUps}
              keyExtractor={(_, i) => String(i)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}
              renderItem={({ item }) => (
                <Pressable style={styles.followChip} onPress={() => send(item)}>
                  <AppText variant="caption" color={colors.brandDark}>
                    {item}
                  </AppText>
                </Pressable>
              )}
            />
          </View>
        ) : null}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything about travel…"
            placeholderTextColor={colors.ink400}
            value={input}
            onChangeText={setInput}
            multiline
            selectionColor={colors.brand}
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendDisabled]}
            onPress={() => send(input)}
            disabled={!input.trim() || sending}>
            <Send size={20} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ bubble }: { bubble: Bubble }) {
  const isUser = bubble.role === 'user';
  const ai = bubble.reply?.aiResponse;
  return (
    <View style={[styles.bubbleRow, isUser ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {bubble.pending ? (
          <ActivityIndicator color={colors.brand} />
        ) : (
          <>
            <AppText variant="body" color={isUser ? colors.white : colors.ink800}>
              {bubble.content}
            </AppText>

            {ai?.destinations && ai.destinations.length > 0 ? (
              <View style={styles.destRow}>
                {ai.destinations.slice(0, 4).map(d => (
                  <View key={d} style={styles.destChip}>
                    <MapPin size={12} color={colors.brand} />
                    <AppText variant="label" color={colors.ink700}>
                      {d}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : null}

            {ai?.itinerary && ai.itinerary.length > 0 ? (
              <View style={styles.itin}>
                {ai.itinerary.slice(0, 5).map(d => (
                  <View key={d.day} style={styles.itinDay}>
                    <AppText variant="label" color={colors.brand}>
                      DAY {d.day}
                    </AppText>
                    <AppText variant="caption" color={colors.ink700} style={{ flex: 1 }}>
                      {d.title}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : null}

            {ai?.tips && ai.tips.length > 0 ? (
              <View style={styles.tips}>
                {ai.tips.slice(0, 3).map((t, i) => (
                  <View key={i} style={styles.tipRow}>
                    <Lightbulb size={13} color={colors.gold} />
                    <AppText variant="caption" muted style={{ flex: 1 }}>
                      {t}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : null}

            {ai?.estimatedCost ? (
              <View style={styles.costTag}>
                <AppText variant="label" color={colors.brandDark}>
                  Est. {ai.estimatedCost}
                </AppText>
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

function EmptyState({ onPick }: { onPick: (t: string) => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Sparkles size={30} color={colors.white} />
      </View>
      <AppText variant="h2" center>
        Your AI travel guide
      </AppText>
      <AppText variant="body" muted center style={styles.emptySub}>
        Ask about destinations, budgets, itineraries, visas — anything travel.
      </AppText>
      <View style={styles.starters}>
        {STARTERS.map(s => (
          <Pressable key={s} style={styles.starter} onPress={() => onPick(s)}>
            <AppText variant="body" color={colors.ink700}>
              {s}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
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
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2FBF71' },
  aiDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.xl, gap: spacing.md },
  bubbleRow: { flexDirection: 'row' },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '84%', padding: 14, borderRadius: radius.lg },
  userBubble: { backgroundColor: colors.brand, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  destRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  destChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  itin: { marginTop: 10, gap: 6 },
  itinDay: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tips: { marginTop: 8, gap: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  costTag: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  followRow: { paddingVertical: spacing.sm },
  followChip: {
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
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
    maxHeight: 120,
    minHeight: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink900,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  sendDisabled: { backgroundColor: colors.ink300 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  emptySub: { marginTop: spacing.sm, marginBottom: spacing.xl },
  starters: { width: '100%', gap: spacing.md },
  starter: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
});
