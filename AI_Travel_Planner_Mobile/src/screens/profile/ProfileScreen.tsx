import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  ChevronRight,
  Heart,
  HelpCircle,
  LogOut,
  Shield,
  Users,
  Wallet,
} from 'lucide-react-native';
import { AppText, Card } from '../../components/ui';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const MENU = [
  { key: 'saved', label: 'Saved places', icon: Heart, tint: colors.coral },
  { key: 'expenses', label: 'Expense splits', icon: Wallet, tint: colors.green },
  { key: 'community', label: 'Community', icon: Users, tint: colors.purple },
  { key: 'safety', label: 'Safety center', icon: Shield, tint: colors.brand },
  { key: 'notifications', label: 'Notifications', icon: Bell, tint: colors.gold },
  { key: 'help', label: 'Help & support', icon: HelpCircle, tint: colors.ink500 },
];

export function ProfileScreen() {
  const { profile, firebaseUser, signOut } = useAuth();
  const name =
    profile?.username || firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'Traveler';
  const email = profile?.email || firebaseUser?.email || '';

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <AppText variant="h1" style={styles.title}>
            Profile
          </AppText>

          <Card style={styles.profileCard} rounded="xxl">
            <View style={styles.avatar}>
              <AppText variant="h1" color={colors.white}>
                {name.charAt(0).toUpperCase()}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="h3">{name}</AppText>
              {email ? (
                <AppText variant="caption" muted>
                  {email}
                </AppText>
              ) : null}
            </View>
          </Card>

          <View style={styles.menu}>
            {MENU.map((m, i) => {
              const Icon = m.icon;
              return (
                <Pressable
                  key={m.key}
                  style={[styles.row, i < MENU.length - 1 && styles.rowBorder]}>
                  <View style={[styles.rowIcon, { backgroundColor: m.tint + '1A' }]}>
                    <Icon size={20} color={m.tint} />
                  </View>
                  <AppText variant="title" style={{ flex: 1 }}>
                    {m.label}
                  </AppText>
                  <ChevronRight size={20} color={colors.ink300} />
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.signout} onPress={signOut}>
            <LogOut size={20} color={colors.danger} />
            <AppText variant="bodyStrong" color={colors.danger}>
              Sign out
            </AppText>
          </Pressable>

          <AppText variant="caption" muted center style={styles.version}>
            AI Travel Planner · v1.0.0
          </AppText>
          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  title: { marginTop: spacing.sm, marginBottom: spacing.lg },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    ...{
      shadowColor: '#243B6B',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 3,
    },
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: spacing.xl,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
  },
  version: { marginTop: spacing.xl },
});
