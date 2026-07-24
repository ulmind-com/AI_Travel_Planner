import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, HelpCircle, Mail } from 'lucide-react-native';
import { AppText, StackHeader } from '../../components/ui';
import { Gradient } from '../../components/ui/Gradient';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import { openEmail } from '../../lib/links';
import { FAQ, CONTACT } from './content';
import { selectionTick } from '../../lib/haptics';
import type { MainStackScreenProps } from '../../navigation/types';

export function HelpScreen({ navigation }: MainStackScreenProps<'Help'>) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StackHeader title="Help & FAQ" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Gradient colors={colors.brandGradient} style={styles.hero}>
          <View style={styles.heroIcon}>
            <HelpCircle size={26} color={colors.white} />
          </View>
          <AppText variant="h2" color={colors.white} center>
            How can we help?
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.85)" center style={{ marginTop: 4 }}>
            Answers to the most common questions.
          </AppText>
        </Gradient>

        {FAQ.map((item, i) => {
          const expanded = open === i;
          return (
            <Pressable
              key={i}
              style={styles.item}
              onPress={() => {
                selectionTick();
                setOpen(expanded ? null : i);
              }}>
              <View style={styles.itemHead}>
                <AppText variant="bodyStrong" style={{ flex: 1 }}>
                  {item.q}
                </AppText>
                <ChevronDown
                  size={20}
                  color={colors.ink400}
                  style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
                />
              </View>
              {expanded ? (
                <AppText variant="body" color={colors.ink700} style={styles.answer}>
                  {item.a}
                </AppText>
              ) : null}
            </Pressable>
          );
        })}

        <Pressable style={styles.contact} onPress={() => openEmail(CONTACT.email, 'Support request')}>
          <Mail size={18} color={colors.brand} />
          <AppText variant="bodyStrong" color={colors.brand}>
            Still need help? Email us
          </AppText>
        </Pressable>
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  hero: {
    alignItems: 'center',
    borderRadius: radius.xxl,
    paddingVertical: spacing.xxl,
    marginBottom: spacing.xl,
    ...shadow.md,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  item: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  answer: { marginTop: spacing.md, lineHeight: 22 },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.md,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
  },
});
