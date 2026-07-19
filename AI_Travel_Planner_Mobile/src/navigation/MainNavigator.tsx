import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { PlannerScreen } from '../screens/planner/PlannerScreen';
import { PlanResultsScreen } from '../screens/planner/PlanResultsScreen';
import { PlanDetailScreen } from '../screens/planner/PlanDetailScreen';
import { AIChatScreen } from '../screens/ai/AIChatScreen';
import { PostDetailScreen } from '../screens/community/PostDetailScreen';
import { CreatePostScreen } from '../screens/community/CreatePostScreen';
import { GroupsScreen } from '../screens/community/GroupsScreen';
import { ExperienceDetailScreen } from '../screens/explore/ExperienceDetailScreen';
import { CreateExperienceScreen } from '../screens/explore/CreateExperienceScreen';
import { PeopleScreen } from '../screens/social/PeopleScreen';
import { FriendsScreen } from '../screens/social/FriendsScreen';
import { NotificationsScreen } from '../screens/social/NotificationsScreen';
import { ConversationsScreen } from '../screens/messaging/ConversationsScreen';
import { ChatScreen } from '../screens/messaging/ChatScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SafetyScreen } from '../screens/safety/SafetyScreen';
import { TrainsScreen } from '../screens/trains/TrainsScreen';
import { ExpensesScreen } from '../screens/expenses/ExpensesScreen';
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
      <Stack.Screen name="AIChat" component={AIChatScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="Groups" component={GroupsScreen} />
      <Stack.Screen name="ExperienceDetail" component={ExperienceDetailScreen} />
      <Stack.Screen
        name="CreateExperience"
        component={CreateExperienceScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="People" component={PeopleScreen} />
      <Stack.Screen name="Friends" component={FriendsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Conversations" component={ConversationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="Safety" component={SafetyScreen} />
      <Stack.Screen name="Trains" component={TrainsScreen} />
      <Stack.Screen name="Expenses" component={ExpensesScreen} />
    </Stack.Navigator>
  );
}
