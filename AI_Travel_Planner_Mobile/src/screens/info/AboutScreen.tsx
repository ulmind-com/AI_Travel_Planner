import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { AppText, StackHeader } from '../../components/ui';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import { ABOUT } from './content';
import type { MainStackScreenProps } from '../../navigation/types';

export function AboutScreen({ navigation }: MainStackScreenProps<'About'>) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StackHeader title="About" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <LottieView
            source={require('../../assets/lottie/travel-bag.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
          <AppText variant="h1" center>
            AI Travel Planner
          </AppText>
          <AppText variant="body" color={colors.brand} center style={{ marginTop: 4 }}>
            {ABOUT.tagline}
          </AppText>
        </View>

        <View style={styles.stats}>
          {ABOUT.stats.map((s, i) => (
            <View key={i} style={styles.stat}>
              <AppText variant="h2" color={colors.brandDark}>
                {s.value}
              </AppText>
              <AppText variant="label" muted>
                {s.label}
              </AppText>
            </View>
          ))}
        </View>

        {ABOUT.body.map((p, i) => (
          <AppText key={i} variant="body" color={colors.ink700} style={styles.para}>
            {p}
          </AppText>
        ))}

        <AppText variant="caption" muted center style={styles.version}>
          Version 1.0.0 · Made for travellers
        </AppText>
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  top: { alignItems: 'center', marginBottom: spacing.xl },
  lottie: { width: 150, height: 150 },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
    ...shadow.sm,
  },
  stat: { flex: 1, alignItems: 'center' },
  para: { lineHeight: 24, marginBottom: spacing.lg },
  version: { marginTop: spacing.md },
});
