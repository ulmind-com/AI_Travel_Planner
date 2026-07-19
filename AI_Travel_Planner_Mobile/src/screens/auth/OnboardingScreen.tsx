import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { AppText, Button, GradientBackground } from '../../components/ui';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme';
import type { AuthStackScreenProps } from '../../navigation/types';

export function OnboardingScreen({ navigation }: AuthStackScreenProps<'Onboarding'>) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, useNativeDriver: true, speed: 6, bounciness: 6 }),
    ]).start();
  }, [fade, rise]);

  return (
    <GradientBackground variant="skyDeep">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.hero}>
          <LottieView
            source={require('../../assets/lottie/travel-bag.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>

        <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: rise }] }]}>
          <AppText variant="label" color={colors.brandDark} style={styles.kicker}>
            AI TRAVEL PLANNER
          </AppText>
          <AppText variant="hero" style={styles.title}>
            Plan smarter.{'\n'}Wander further.
          </AppText>
          <AppText variant="body" muted center style={styles.subtitle}>
            Craft dream itineraries with AI, discover hidden gems, split expenses,
            and travel with a community you trust.
          </AppText>

          <View style={styles.actions}>
            <Button label="Get started" onPress={() => navigation.navigate('SignUp')} />
            <View style={{ height: spacing.md }} />
            <Button
              label="I already have an account"
              variant="glass"
              onPress={() => navigation.navigate('SignIn')}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lottie: { width: 260, height: 260 },
  content: { paddingBottom: spacing.xl },
  kicker: { textAlign: 'center', letterSpacing: 2, marginBottom: spacing.sm },
  title: { textAlign: 'center', marginBottom: spacing.md },
  subtitle: { paddingHorizontal: spacing.md, marginBottom: spacing.xxl },
  actions: { width: '100%' },
});
