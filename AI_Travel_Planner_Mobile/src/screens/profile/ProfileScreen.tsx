import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  ChevronRight,
  Compass,
  CreditCard,
  LogOut,
  MessageCircle,
  Pencil,
  Shield,
  ShieldCheck,
  Train,
  Users,
  Wallet,
} from 'lucide-react-native';
import { AppText, Card } from '../../components/ui';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { getTrustScore } from '../../services/socialService';
import type { TabScreenProps } from '../../navigation/types';

export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const { profile, firebaseUser, signOut } = useAuth();
  const name =
    profile?.username || firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'Traveler';
  const email = profile?.email || firebaseUser?.email || '';
  const avatar = profile?.profileImage || (profile as any)?.profilepicture;

  const { data: trust } = useQuery({
    queryKey: ['trust', firebaseUser?.uid],
    queryFn: () => getTrustScore(firebaseUser!.uid),
    enabled: !!firebaseUser?.uid,
  });
  const trustScore = trust?.trustScore ?? (trust as any)?.score;

  const MENU: {
    key: string;
    label: string;
    icon: any;
    tint: string;
    go: () => void;
  }[] = [
    { key: 'trips', label: 'Saved trips', icon: Compass, tint: colors.brand, go: () => navigation.navigate('Tabs') },
    { key: 'expenses', label: 'Expense splits', icon: Wallet, tint: colors.green, go: () => navigation.navigate('Expenses') },
    { key: 'trains', label: 'Train bookings', icon: Train, tint: colors.blueChip, go: () => navigation.navigate('Trains') },
    { key: 'people', label: 'Find travelers', icon: Users, tint: colors.purple, go: () => navigation.navigate('People') },
    { key: 'messages', label: 'Messages', icon: MessageCircle, tint: colors.brandDark, go: () => navigation.navigate('Conversations') },
    { key: 'safety', label: 'Safety center', icon: Shield, tint: colors.coral, go: () => navigation.navigate('Safety') },
    { key: 'notifications', label: 'Notifications', icon: Bell, tint: colors.gold, go: () => navigation.navigate('Notifications') },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.topRow}>
            <AppText variant="h1">Profile</AppText>
            <Pressable style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
              <Pencil size={18} color={colors.brand} />
            </Pressable>
          </View>

          <Card style={styles.profileCard} rounded="xxl">
            <View style={styles.avatar}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <AppText variant="h1" color={colors.white}>
                  {name.charAt(0).toUpperCase()}
                </AppText>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="h3">{name}</AppText>
              {email ? (
                <AppText variant="caption" muted numberOfLines={1}>
                  {email}
                </AppText>
              ) : null}
              {profile?.bio ? (
                <AppText variant="caption" color={colors.ink600} numberOfLines={2} style={{ marginTop: 4 }}>
                  {profile.bio}
                </AppText>
              ) : null}
            </View>
          </Card>

          {typeof trustScore === 'number' ? (
            <Card style={styles.trustCard} rounded="xl">
              <View style={styles.trustIcon}>
                <ShieldCheck size={22} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">Trust score</AppText>
                <AppText variant="caption" muted>
                  Based on your activity & community standing
                </AppText>
              </View>
              <AppText variant="h2" color={colors.success}>
                {Math.round(trustScore)}
              </AppText>
            </Card>
          ) : null}

          <View style={styles.menu}>
            {MENU.map((m, i) => {
              const Icon = m.icon;
              return (
                <Pressable
                  key={m.key}
                  style={[styles.row, i < MENU.length - 1 && styles.rowBorder]}
                  onPress={m.go}>
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
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.greenSoft,
    marginBottom: spacing.xl,
  },
  trustIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    ...shadow.sm,
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
