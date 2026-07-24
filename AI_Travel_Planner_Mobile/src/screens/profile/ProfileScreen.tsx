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
  Ticket,
  Radar,
  Shield,
  ShieldCheck,
  Star,
  Train,
  Users,
  Wallet,
} from 'lucide-react-native';
import { AppText } from '../../components/ui';
import { Gradient } from '../../components/ui/Gradient';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { getTrustScore } from '../../services/socialService';
import { getDisplayName, getInitial } from '../../lib/name';
import type { TabScreenProps } from '../../navigation/types';

export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const { profile, firebaseUser, signOut } = useAuth();
  const name = getDisplayName(profile, firebaseUser);
  const initial = getInitial(profile, firebaseUser);
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
    { key: 'trips', label: 'Saved trips', icon: Compass, tint: colors.brand, go: () => navigation.navigate('Trips', { view: 'saved' }) },
    { key: 'expenses', label: 'Expense splits', icon: Wallet, tint: colors.green, go: () => navigation.navigate('Expenses') },
    { key: 'bookings', label: 'My bookings', icon: Ticket, tint: colors.coral, go: () => navigation.navigate('Bookings') },
    { key: 'trains', label: 'Train bookings', icon: Train, tint: colors.blueChip, go: () => navigation.navigate('Trains') },
    { key: 'intel', label: 'Live travel intel', icon: Radar, tint: colors.brand, go: () => navigation.navigate('TravelIntel') },
    { key: 'people', label: 'Find travelers', icon: Users, tint: colors.purple, go: () => navigation.navigate('People') },
    { key: 'messages', label: 'Messages', icon: MessageCircle, tint: colors.brandDark, go: () => navigation.navigate('Conversations') },
    { key: 'safety', label: 'Safety center', icon: Shield, tint: colors.coral, go: () => navigation.navigate('Safety') },
    { key: 'reviews', label: 'Reviews', icon: Star, tint: colors.gold, go: () => navigation.navigate('Reviews') },
    { key: 'notifications', label: 'Notifications', icon: Bell, tint: colors.gold, go: () => navigation.navigate('Notifications') },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Gradient hero */}
          <Gradient colors={colors.brandGradient} style={styles.hero}>
            <View pointerEvents="none" style={[styles.heroBlob, styles.heroBlobA]} />
            <View pointerEvents="none" style={[styles.heroBlob, styles.heroBlobB]} />

            <View style={styles.heroTop}>
              <AppText variant="h3" color={colors.white}>
                Profile
              </AppText>
              <Pressable style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')} hitSlop={8}>
                <Pencil size={17} color={colors.white} />
              </Pressable>
            </View>

            <View style={styles.heroBody}>
              <View style={styles.avatar}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatarImg} />
                ) : (
                  <AppText variant="hero" color={colors.white}>
                    {initial}
                  </AppText>
                )}
              </View>
              <AppText variant="h1" color={colors.white} style={{ marginTop: spacing.md }}>
                {name}
              </AppText>
              {email ? (
                <AppText variant="caption" color="rgba(255,255,255,0.85)" numberOfLines={1}>
                  {email}
                </AppText>
              ) : null}
              {profile?.bio ? (
                <AppText
                  variant="caption"
                  color="rgba(255,255,255,0.9)"
                  center
                  numberOfLines={2}
                  style={styles.heroBio}>
                  {profile.bio}
                </AppText>
              ) : null}

              {typeof trustScore === 'number' ? (
                <View style={styles.trustPill}>
                  <ShieldCheck size={15} color={colors.white} />
                  <AppText variant="bodyStrong" color={colors.white}>
                    Trust {Math.round(trustScore)}
                  </AppText>
                </View>
              ) : null}
            </View>
          </Gradient>

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
  scroll: { paddingBottom: spacing.sm },
  hero: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  heroBlob: { position: 'absolute', borderRadius: 200, backgroundColor: 'rgba(255,255,255,0.12)' },
  heroBlobA: { width: 220, height: 220, top: -90, right: -60 },
  heroBlobB: { width: 180, height: 180, bottom: -70, left: -50, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    height: 44,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: { alignItems: 'center', paddingHorizontal: spacing.xl, marginTop: spacing.md },
  heroBio: { marginTop: spacing.sm, paddingHorizontal: spacing.lg },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarImg: { width: '100%', height: '100%' },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  menu: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.xl,
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
    marginHorizontal: spacing.xl,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
  },
  version: { marginTop: spacing.xl },
});
