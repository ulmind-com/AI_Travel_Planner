import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, ChevronRight, Minus, Plus, Sparkles, X } from 'lucide-react-native';
import { AppText, Button, Input, SelectChip } from '../../components/ui';
import {
  DatePickerSheet,
  formatFriendly,
  toISODate,
} from '../../components/ui/DatePickerSheet';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { radius, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import type { MainStackScreenProps } from '../../navigation/types';
import type { PlanSearchInput } from '../../types/plan';

/**
 * Budget tiers map to a numeric spend cap (INR) — the backend Plan model stores
 * `budget` as a Number and `budget_range` as the tier label.
 */
const BUDGETS: { key: string; range: 'budget' | 'mid' | 'luxury'; amount: number; hint: string }[] = [
  { key: 'Budget', range: 'budget', amount: 25000, hint: '≈ ₹25k' },
  { key: 'Comfort', range: 'mid', amount: 65000, hint: '≈ ₹65k' },
  { key: 'Luxury', range: 'luxury', amount: 200000, hint: '≈ ₹2L' },
];
const DURATIONS = [
  { key: 'Weekend', label: 'Weekend', days: 3 },
  { key: 'Short', label: 'Short trip', days: 5 },
  { key: 'Week', label: 'A week', days: 7 },
  { key: 'Long', label: 'Long haul', days: 10 },
];
const STYLES = ['Adventure', 'Relax', 'Culture', 'Food', 'Nature', 'Nightlife', 'Shopping', 'Beaches'];
const CUSTOM = 'Custom';

/** Infer the tier label the backend expects from a free-form amount. */
function rangeForAmount(amount: number): 'budget' | 'mid' | 'luxury' {
  if (amount <= 35000) return 'budget';
  if (amount <= 120000) return 'mid';
  return 'luxury';
}

/** 65000 -> "65,000" */
function groupDigits(v: string): string {
  const n = v.replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString('en-IN') : '';
}

/** Default: two weeks out, so the AI gets a realistic near-future trip date. */
function defaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return toISODate(d);
}

export function PlannerScreen({ navigation, route }: MainStackScreenProps<'Planner'>) {
  const { profile } = useAuth();

  const [to, setTo] = useState(route.params?.prefillTo ?? '');
  const [from, setFrom] = useState(profile?.city || '');
  const [date, setDate] = useState(defaultDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [travelersText, setTravelersText] = useState('2');
  const [budget, setBudget] = useState('Comfort');
  const [customBudget, setCustomBudget] = useState('');
  const [customDays, setCustomDays] = useState('');
  const [customVibes, setCustomVibes] = useState<string[]>([]);
  const [vibeInput, setVibeInput] = useState('');
  const [addingVibe, setAddingVibe] = useState(false);
  const [duration, setDuration] = useState('Short');
  const [styleSel, setStyleSel] = useState<string[]>(['Culture', 'Food']);
  const [error, setError] = useState('');

  const travelers = Math.min(99, Math.max(1, parseInt(travelersText, 10) || 1));
  const bumpTravelers = (delta: number) =>
    setTravelersText(String(Math.min(99, Math.max(1, travelers + delta))));

  const toggleStyle = (s: string) =>
    setStyleSel(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]));

  const addVibe = () => {
    const v = vibeInput.trim().replace(/\s+/g, ' ');
    if (!v) return setAddingVibe(false);
    const exists = [...STYLES, ...customVibes].some(x => x.toLowerCase() === v.toLowerCase());
    if (!exists) setCustomVibes(prev => [...prev, v]);
    setStyleSel(prev => (prev.some(x => x.toLowerCase() === v.toLowerCase()) ? prev : [...prev, v]));
    setVibeInput('');
    setAddingVibe(false);
  };

  const removeVibe = (v: string) => {
    setCustomVibes(prev => prev.filter(x => x !== v));
    setStyleSel(prev => prev.filter(x => x !== v));
  };

  const onGenerate = () => {
    setError('');
    if (!to.trim()) return setError('Where do you want to go?');
    if (!from.trim()) return setError('Where are you travelling from?');

    let amount: number;
    let range: 'budget' | 'mid' | 'luxury';
    if (budget === CUSTOM) {
      amount = parseInt(customBudget.replace(/[^0-9]/g, ''), 10) || 0;
      if (amount < 1000) return setError('Enter a budget of at least ₹1,000.');
      range = rangeForAmount(amount);
    } else {
      const meta = BUDGETS.find(b => b.key === budget)!;
      amount = meta.amount;
      range = meta.range;
    }

    let days: number;
    if (duration === CUSTOM) {
      days = parseInt(customDays.replace(/[^0-9]/g, ''), 10) || 0;
      if (days < 1 || days > 60) return setError('Trip length must be between 1 and 60 days.');
    } else {
      days = DURATIONS.find(d => d.key === duration)!.days;
    }

    if (styleSel.length === 0) return setError('Pick at least one vibe for your trip.');

    const input: PlanSearchInput = {
      to: to.trim(),
      from: from.trim(),
      date,
      travelers,
      budget: amount,
      budget_range: range,
      travel_style: styleSel[0] ?? 'Balanced',
      activities: styleSel,
      duration: days,
    };
    navigation.navigate('PlanResults', { input });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <AppText variant="h2">Plan a trip</AppText>
              <AppText variant="caption" muted>
                Tell the AI your vibe — get a full itinerary.
              </AppText>
            </View>
            <Pressable onPress={() => navigation.goBack()} style={styles.close} hitSlop={10}>
              <X size={20} color={colors.ink600} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Input
            label="Destination"
            placeholder="e.g. Kyoto, Japan"
            value={to}
            onChangeText={setTo}
            autoCapitalize="words"
          />
          <View style={{ height: spacing.lg }} />
          <Input
            label="Travelling from"
            placeholder="e.g. Amsterdam"
            value={from}
            onChangeText={setFrom}
            autoCapitalize="words"
          />

          <Section title="When">
            <Pressable style={styles.dateField} onPress={() => setShowDatePicker(true)}>
              <View style={styles.dateIcon}>
                <CalendarDays size={20} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="label" muted>
                  DEPARTURE DATE
                </AppText>
                <AppText variant="bodyStrong">{formatFriendly(date)}</AppText>
              </View>
              <ChevronRight size={20} color={colors.ink300} />
            </Pressable>
          </Section>

          <Section title="Travelers">
            <View style={styles.stepper}>
              <Pressable style={styles.stepBtn} onPress={() => bumpTravelers(-1)}>
                <Minus size={18} color={colors.ink700} />
              </Pressable>
              <View style={styles.stepValue}>
                <TextInput
                  style={styles.stepInput}
                  value={travelersText}
                  onChangeText={t => setTravelersText(t.replace(/[^0-9]/g, '').slice(0, 2))}
                  onBlur={() => setTravelersText(String(travelers))}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectionColor={colors.brand}
                />
                <AppText variant="caption" muted>
                  {travelers === 1 ? 'traveler' : 'travelers'}
                </AppText>
              </View>
              <Pressable style={styles.stepBtn} onPress={() => bumpTravelers(1)}>
                <Plus size={18} color={colors.ink700} />
              </Pressable>
            </View>
          </Section>

          <Section title="Budget">
            <View style={styles.wrapRow}>
              {BUDGETS.map(b => (
                <SelectChip
                  key={b.key}
                  label={`${b.key} · ${b.hint}`}
                  selected={budget === b.key}
                  onPress={() => setBudget(b.key)}
                />
              ))}
              <SelectChip
                label="Custom"
                selected={budget === CUSTOM}
                onPress={() => setBudget(CUSTOM)}
              />
            </View>

            {budget === CUSTOM ? (
              <View style={styles.amountField}>
                <AppText variant="h3" color={colors.ink500}>
                  ₹
                </AppText>
                <TextInput
                  style={styles.amountInput}
                  value={groupDigits(customBudget)}
                  onChangeText={t => setCustomBudget(t.replace(/[^0-9]/g, '').slice(0, 9))}
                  placeholder="Your total budget"
                  placeholderTextColor={colors.ink400}
                  keyboardType="number-pad"
                  selectionColor={colors.brand}
                  autoFocus
                />
              </View>
            ) : null}
          </Section>

          <Section title="Trip length">
            <View style={styles.wrapRow}>
              {DURATIONS.map(d => (
                <SelectChip
                  key={d.key}
                  label={`${d.label} · ${d.days}d`}
                  selected={duration === d.key}
                  onPress={() => setDuration(d.key)}
                />
              ))}
              <SelectChip
                label="Custom"
                selected={duration === CUSTOM}
                onPress={() => setDuration(CUSTOM)}
              />
            </View>

            {duration === CUSTOM ? (
              <View style={styles.amountField}>
                <TextInput
                  style={styles.amountInput}
                  value={customDays}
                  onChangeText={t => setCustomDays(t.replace(/[^0-9]/g, '').slice(0, 2))}
                  placeholder="How many days?"
                  placeholderTextColor={colors.ink400}
                  keyboardType="number-pad"
                  selectionColor={colors.brand}
                  autoFocus
                />
                <AppText variant="body" muted>
                  days
                </AppText>
              </View>
            ) : null}
          </Section>

          <Section title="Your vibe">
            <View style={styles.wrapRow}>
              {STYLES.map(s => (
                <SelectChip
                  key={s}
                  label={s}
                  selected={styleSel.includes(s)}
                  onPress={() => toggleStyle(s)}
                />
              ))}

              {/* User-added vibes — tap to toggle, × to delete */}
              {customVibes.map(v => {
                const on = styleSel.includes(v);
                return (
                  <Pressable
                    key={v}
                    onPress={() => toggleStyle(v)}
                    style={[styles.customVibe, on ? styles.customVibeOn : styles.customVibeOff]}>
                    <AppText variant="bodyStrong" color={on ? colors.white : colors.ink700}>
                      {v}
                    </AppText>
                    <Pressable onPress={() => removeVibe(v)} hitSlop={8}>
                      <X size={14} color={on ? colors.white : colors.ink400} />
                    </Pressable>
                  </Pressable>
                );
              })}

              {addingVibe ? (
                <View style={styles.vibeInputWrap}>
                  <TextInput
                    style={styles.vibeInput}
                    value={vibeInput}
                    onChangeText={setVibeInput}
                    placeholder="e.g. Wildlife"
                    placeholderTextColor={colors.ink400}
                    autoFocus
                    maxLength={24}
                    returnKeyType="done"
                    onSubmitEditing={addVibe}
                    onBlur={addVibe}
                    selectionColor={colors.brand}
                  />
                </View>
              ) : (
                <Pressable style={styles.addVibe} onPress={() => setAddingVibe(true)}>
                  <Plus size={16} color={colors.brand} />
                  <AppText variant="bodyStrong" color={colors.brand}>
                    Add your own
                  </AppText>
                </Pressable>
              )}
            </View>
          </Section>

          {error ? (
            <AppText variant="caption" color={colors.danger} style={{ marginTop: spacing.md }}>
              {error}
            </AppText>
          ) : null}

          <View style={{ height: spacing.xl }} />
          <Button
            label="Generate my trip"
            icon={<Sparkles size={18} color={colors.white} />}
            onPress={onGenerate}
          />
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerSheet
        visible={showDatePicker}
        value={date}
        onSelect={setDate}
        onClose={() => setShowDatePicker(false)}
      />
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="label" color={colors.ink600} style={styles.sectionTitle}>
        {title.toUpperCase()}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  section: { marginTop: spacing.xl },
  sectionTitle: { marginBottom: spacing.md, letterSpacing: 1 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dateIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stepInput: {
    fontFamily: fonts.heading,
    fontSize: 20,
    lineHeight: 26,
    color: colors.ink900,
    textAlign: 'center',
    minWidth: 56,
    paddingVertical: 0,
  },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    height: 60,
    borderWidth: 1.5,
    borderColor: colors.brand,
  },
  amountInput: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink900,
    paddingVertical: 0,
  },
  customVibe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  customVibeOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  customVibeOff: { backgroundColor: colors.surface, borderColor: 'transparent' },
  addVibe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    borderWidth: 1.5,
    borderColor: colors.brand,
    borderStyle: 'dashed',
  },
  vibeInputWrap: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 44,
    minWidth: 150,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.brand,
  },
  vibeInput: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.ink900,
    paddingVertical: 0,
  },
});
