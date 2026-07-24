import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, StackHeader } from '../../components/ui';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme';
import { PRIVACY, TERMS } from './content';
import type { MainStackScreenProps } from '../../navigation/types';

export function LegalScreen({ navigation, route }: MainStackScreenProps<'Legal'>) {
  const isPrivacy = route.params?.kind === 'privacy';
  const sections = isPrivacy ? PRIVACY : TERMS;
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StackHeader title={title} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText variant="caption" muted style={styles.updated}>
          Last updated: July 2026
        </AppText>
        {sections.map((s, i) => (
          <View key={i} style={styles.section}>
            <AppText variant="h3" style={styles.heading}>
              {s.heading}
            </AppText>
            <AppText variant="body" color={colors.ink700} style={styles.body}>
              {s.body}
            </AppText>
          </View>
        ))}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  updated: { marginBottom: spacing.lg },
  section: { marginBottom: spacing.xl },
  heading: { marginBottom: spacing.sm },
  body: { lineHeight: 23 },
});
