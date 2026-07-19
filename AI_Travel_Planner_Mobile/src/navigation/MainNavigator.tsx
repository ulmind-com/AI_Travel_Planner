import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { PlannerScreen } from '../screens/planner/PlannerScreen';
import { PlanResultsScreen } from '../screens/planner/PlanResultsScreen';
import { PlanDetailScreen } from '../screens/planner/PlanDetailScreen';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="Planner"
        component={PlannerScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="PlanResults" component={PlanResultsScreen} />
      <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />
    </Stack.Navigator>
  );
}
