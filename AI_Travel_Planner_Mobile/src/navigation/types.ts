import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { Plan, PlanSearchInput } from '../types/plan';

export type AuthStackParamList = {
  Onboarding: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Trips: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  Planner: { prefillTo?: string } | undefined;
  PlanResults: { input: PlanSearchInput };
  PlanDetail: { plan: Plan };
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type MainStackScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  T
>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<MainStackParamList>
>;
