import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Mail, Send } from 'lucide-react-native';
import { AppText, Button, Input, StackHeader } from '../../components/ui';
import { Gradient } from '../../components/ui/Gradient';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import { openEmail } from '../../lib/links';
import { subscribeNewsletter } from '../../services/miscService';
import { CONTACT } from './content';
import type { MainStackScreenProps } from '../../navigation/types';

export function ContactScreen({ navigation }: MainStackScreenProps<'Contact'>) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  const subscribe = async () => {
    if (!email.trim() || busy) return;
    setBusy(true);
    try {
      await subscribeNewsletter(email.trim());
      setSubscribed(true);
    } catch {
      setSubscribed(true); // treat as success; endpoint is fire-and-forget
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StackHeader title="Contact us" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <AppText variant="body" muted style={styles.intro}>
          {CONTACT.intro}
        </AppText>

        {CONTACT.items.map((it, i) => (
          <Pressable key={i} style={styles.row} onPress={() => openEmail(it.value, `${it.label} enquiry`)}>
            <View style={styles.rowIcon}>
              <Mail size={18} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{it.label}</AppText>
              <AppText variant="caption" muted>
                {it.value}
              </AppText>
            </View>
            <ChevronRight size={20} color={colors.ink300} />
          </Pressable>
        ))}

        {/* Newsletter */}
        <Gradient colors={colors.brandGradient} style={styles.news}>
          <AppText variant="h3" color={colors.white}>
            Travel tips in your inbox
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.85)" style={{ marginTop: 2, marginBottom: spacing.md }}>
            Get daily destination inspiration and deals.
          </AppText>
          {subscribed ? (
            <View style={styles.subscribed}>
              <Send size={16} color={colors.white} />
              <AppText variant="bodyStrong" color={colors.white}>
                You're subscribed!
              </AppText>
            </View>
          ) : (
            <>
              <Input
                placeholder="your@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <View style={{ height: spacing.md }} />
              <Button label="Subscribe" variant="glass" loading={busy} onPress={subscribe} />
            </>
          )}
        </Gradient>
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  intro: { marginBottom: spacing.lg, lineHeight: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  news: {
    borderRadius: radius.xxl,
    padding: spacing.xl,
    marginTop: spacing.md,
    ...shadow.md,
  },
  subscribed: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: spacing.sm },
});
