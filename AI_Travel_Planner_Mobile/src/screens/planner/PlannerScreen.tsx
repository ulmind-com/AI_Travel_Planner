import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Minus, Plus, Sparkles, X } from 'lucide-react-native';
import { AppText, Button, Input, SelectChip } from '../../components/ui';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import type { MainStackScreenProps } from '../../navigation/types';
import type { PlanSearchInput } from '../../types/plan';

const BUDGETS = [
  { key: 'Budget', range: 'low' },
  { key: 'Comfort', range: 'medium' },
  { key: 'Luxury', range: 'high' },
];
const DURATIONS = [
  { key: 'Weekend', label: 'Weekend', value: '2-3 days' },
  { key: 'Short', label: 'Short trip', value: '4-5 days' },
  { key: 'Week', label: 'A week', value: '7 days' },
  { key: 'Long', label: 'Long haul', value: '10+ days' },
];
const STYLES = ['Adventure', 'Relax', 'Culture', 'Food', 'Nature', 'Nightlife', 'Shopping', 'Beaches'];

function nextMonths(count = 6) {
  const out: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 15);
    out.push({
      label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      value: d.toISOString().slice(0, 10),
    });
  }
  return out;
}

export function PlannerScreen({ navigation, route }: MainStackScreenProps<'Planner'>) {
  const { profile } = useAuth();
  const months = useMemo(() => nextMonths(6), []);

  const [to, setTo] = useState(route.params?.prefillTo ?? '');
  const [from, setFrom] = useState(profile?.city || '');
  const [date, setDate] = useState(months[1].value);
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState('Comfort');
  const [duration, setDuration] = useState('Short');
  const [styleSel, setStyleSel] = useState<string[]>(['Culture', 'Food']);
  const [error, setError] = useState('');

  const toggleStyle = (s: string) =>
    setStyleSel(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]));

  const onGenerate = () => {
    setError('');
    if (!to.trim()) return setError('Where do you want to go?');
    if (!from.trim()) return setError('Where are you travelling from?');

    const budgetMeta = BUDGETS.find(b => b.key === budget)!;
    const durMeta = DURATIONS.find(d => d.key === duration)!;
    const input: PlanSearchInput = {
      to: to.trim(),
      from: from.trim(),
      date,
      travelers,
      budget,
      budget_range: budgetMeta.range,
      travel_style: budget,
      activities: styleSel,
      duration: durMeta.value,
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
            <View style={styles.wrapRow}>
              {months.map(m => (
                <SelectChip
                  key={m.value}
                  label={m.label}
                  selected={date === m.value}
                  onPress={() => setDate(m.value)}
                />
              ))}
            </View>
          </Section>

          <Section title="Travelers">
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setTravelers(t => Math.max(1, t - 1))}>
                <Minus size={18} color={colors.ink700} />
              </Pressable>
              <AppText variant="h3" style={styles.stepValue}>
                {travelers} {travelers === 1 ? 'traveler' : 'travelers'}
              </AppText>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setTravelers(t => Math.min(16, t + 1))}>
                <Plus size={18} color={colors.ink700} />
              </Pressable>
            </View>
          </Section>

          <Section title="Budget">
            <View style={styles.wrapRow}>
              {BUDGETS.map(b => (
                <SelectChip
                  key={b.key}
                  label={b.key}
                  selected={budget === b.key}
                  onPress={() => setBudget(b.key)}
                />
              ))}
            </View>
          </Section>

          <Section title="Trip length">
            <View style={styles.wrapRow}>
              {DURATIONS.map(d => (
                <SelectChip
                  key={d.key}
                  label={d.label}
                  selected={duration === d.key}
                  onPress={() => setDuration(d.key)}
                />
              ))}
            </View>
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
  stepValue: { flex: 1, textAlign: 'center' },
});
