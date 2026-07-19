import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { GradientBackground } from '../components/ui';
import { AppText } from '../components/ui/AppText';
import { colors } from '../theme/colors';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.white, primary: colors.brand },
};

function SplashScreen() {
  return (
    <GradientBackground variant="skyDeep">
      <View style={styles.splash}>
        <LottieView
          source={require('../assets/lottie/travel-bag.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
        <AppText variant="h3" color={colors.brandDark}>
          AI Travel Planner
        </AppText>
      </View>
    </GradientBackground>
  );
}

export function RootNavigator({ fontsReady = true }: { fontsReady?: boolean }) {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping || !fontsReady) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  lottie: { width: 200, height: 200 },
});
