/**
 * AI Travel Planner — Expo (Expo Go compatible) app root.
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { queryClient } from './src/lib/queryClient';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Outfit-Regular': require('./src/assets/fonts/Outfit-Regular.ttf'),
    'Outfit-Medium': require('./src/assets/fonts/Outfit-Medium.ttf'),
    'Outfit-SemiBold': require('./src/assets/fonts/Outfit-SemiBold.ttf'),
    'Outfit-Bold': require('./src/assets/fonts/Outfit-Bold.ttf'),
    'Inter-Regular': require('./src/assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('./src/assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('./src/assets/fonts/Inter-SemiBold.ttf'),
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RootNavigator fontsReady={fontsLoaded} />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
