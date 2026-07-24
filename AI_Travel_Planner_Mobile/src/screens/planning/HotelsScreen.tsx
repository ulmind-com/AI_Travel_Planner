import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, ChevronRight, MapPin, Minus, Plus, Search } from 'lucide-react-native';
import { AppText, Input, StackHeader } from '../../components/ui';
import { DatePickerSheet, formatFriendly } from '../../components/ui/DatePickerSheet';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import { HOTEL_PROVIDERS, extractLocation } from '../../lib/hotelRedirect';
import { openUrl } from '../../lib/links';
import { tapLight } from '../../lib/haptics';
import type { MainStackScreenProps } from '../../navigation/types';

export function HotelsScreen({ navigation, route }: MainStackScreenProps<'Hotels'>) {
  const prefill = (route.params as any)?.destination as string | undefined;
  const [destination, setDestination] = useState(prefill ?? '');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [adults, setAdults] = useState(2);
  const [picker, setPicker] = useState<null | 'in' | 'out'>(null);

  const location = extractLocation(destination);
  const canSearch = !!location.full;

  const open = (providerId: string) => {
    const provider = HOTEL_PROVIDERS.find((p) => p.id === providerId);
    if (!provider || !canSearch) return;
    tapLight();
    openUrl(provider.buildUrl(location, { checkin, checkout, adults }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StackHeader title="Stays & Hotels" subtitle="Compare across top platforms" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Input
            label="Destination"
            placeholder="e.g. Kyoto, Japan"
            icon={<MapPin size={18} color={colors.ink400} />}
            value={destination}
            onChangeText={setDestination}
            autoCapitalize="words"
          />

          <View style={styles.dateRow}>
            <Pressable style={styles.dateField} onPress={() => setPicker('in')}>
              <AppText variant="label" color={colors.ink600}>Check-in</AppText>
              <View style={styles.dateValue}>
                <CalendarDays size={16} color={colors.brand} />
                <AppText variant="body" color={checkin ? colors.ink900 : colors.ink400}>
                  {checkin ? formatFriendly(checkin) : 'Any date'}
                </AppText>
              </View>
            </Pressable>
            <Pressable style={styles.dateField} onPress={() => setPicker('out')}>
              <AppText variant="label" color={colors.ink600}>Check-out</AppText>
              <View style={styles.dateValue}>
                <CalendarDays size={16} color={colors.brand} />
                <AppText variant="body" color={checkout ? colors.ink900 : colors.ink400}>
                  {checkout ? formatFriendly(checkout) : 'Any date'}
                </AppText>
              </View>
            </Pressable>
          </View>

          <View style={styles.guestRow}>
            <AppText variant="bodyStrong">Guests</AppText>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setAdults((n) => Math.max(1, n - 1))}
                hitSlop={8}>
                <Minus size={16} color={colors.ink700} />
              </Pressable>
              <AppText variant="h3" style={{ minWidth: 28, textAlign: 'center' }}>
                {adults}
              </AppText>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setAdults((n) => Math.min(16, n + 1))}
                hitSlop={8}>
                <Plus size={16} color={colors.ink700} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.headingRow}>
          <Search size={16} color={colors.ink500} />
          <AppText variant="bodyStrong" color={colors.ink700}>
            {canSearch ? `Search stays in ${location.city || location.full}` : 'Pick a destination to search'}
          </AppText>
        </View>

        {HOTEL_PROVIDERS.map((provider) => (
          <Pressable
            key={provider.id}
            style={[styles.provider, !canSearch && styles.providerDisabled]}
            disabled={!canSearch}
            onPress={() => open(provider.id)}>
            <View style={[styles.providerEmoji, { backgroundColor: provider.tint + '1A' }]}>
              <AppText variant="h3">{provider.emoji}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{provider.name}</AppText>
              <AppText variant="caption" muted>
                Open live results
              </AppText>
            </View>
            <ChevronRight size={20} color={colors.ink300} />
          </Pressable>
        ))}

        <AppText variant="caption" muted style={styles.note}>
          Prices and availability open on each partner's site. AdventureNexus may earn a referral
          commission at no extra cost to you.
        </AppText>
      </ScrollView>

      <DatePickerSheet
        visible={picker === 'in'}
        value={checkin}
        minDate={new Date()}
        onClose={() => setPicker(null)}
        onSelect={(iso) => {
          setCheckin(iso);
          if (checkout && checkout < iso) setCheckout('');
          setPicker(null);
        }}
      />
      <DatePickerSheet
        visible={picker === 'out'}
        value={checkout}
        minDate={checkin ? new Date(checkin) : new Date()}
        onClose={() => setPicker(null)}
        onSelect={(iso) => {
          setCheckout(iso);
          setPicker(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  body: { padding: spacing.xl, paddingBottom: spacing.huge, gap: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  dateRow: { flexDirection: 'row', gap: spacing.md },
  dateField: {
    flex: 1,
    gap: 6,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  dateValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  guestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  provider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  providerDisabled: { opacity: 0.5 },
  providerEmoji: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { marginTop: spacing.sm, lineHeight: 18 },
});
