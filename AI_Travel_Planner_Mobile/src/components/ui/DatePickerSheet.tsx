import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { Gradient } from './Gradient';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Local-timezone safe YYYY-MM-DD (toISOString would shift the day). */
export function toISODate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** "Sat, 15 Aug 2026" */
export function formatFriendly(iso: string): string {
  const d = parseISODate(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

interface Props {
  visible: boolean;
  value: string; // YYYY-MM-DD
  onClose: () => void;
  onSelect: (iso: string) => void;
  /** Earliest selectable day (defaults to today). */
  minDate?: Date;
}

/**
 * Custom calendar bottom sheet — matches the app's design language and needs no
 * native date-picker module, so it works in Expo Go on every platform.
 */
export function DatePickerSheet({ visible, value, onClose, onSelect, minDate }: Props) {
  const insets = useSafeAreaInsets();
  const today = startOfDay(new Date());
  const floor = startOfDay(minDate ?? today);

  const selected = value ? parseISODate(value) : today;
  const [cursor, setCursor] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));

  // Re-anchor the visible month whenever the sheet reopens.
  const [lastVisible, setLastVisible] = useState(visible);
  if (visible !== lastVisible) {
    setLastVisible(visible);
    if (visible) setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(year, month, d));
    return out;
  }, [cursor]);

  const canGoBack = useMemo(() => {
    const prevMonthEnd = new Date(cursor.getFullYear(), cursor.getMonth(), 0);
    return prevMonthEnd >= floor;
  }, [cursor, floor]);

  const quick = useMemo(() => {
    const mk = (addDays: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + addDays);
      return d;
    };
    // Next Saturday
    const sat = new Date(today);
    sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7));
    return [
      { label: 'This weekend', date: sat },
      { label: 'In 2 weeks', date: mk(14) },
      { label: 'Next month', date: new Date(today.getFullYear(), today.getMonth() + 1, 1) },
    ];
  }, [today]);

  const pick = (d: Date) => {
    onSelect(toISODate(d));
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <AppText variant="h2">Pick a date</AppText>
          <Pressable style={styles.close} onPress={onClose} hitSlop={10}>
            <X size={20} color={colors.ink600} />
          </Pressable>
        </View>

        {/* Quick options */}
        <View style={styles.quickRow}>
          {quick.map(q => (
            <Pressable key={q.label} style={styles.quickChip} onPress={() => pick(q.date)}>
              <AppText variant="label" color={colors.brandDark}>
                {q.label}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* Month nav */}
        <View style={styles.monthRow}>
          <Pressable
            style={[styles.navBtn, !canGoBack && styles.navDisabled]}
            disabled={!canGoBack}
            onPress={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            hitSlop={8}>
            <ChevronLeft size={20} color={canGoBack ? colors.ink700 : colors.ink300} />
          </Pressable>
          <AppText variant="h3">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </AppText>
          <Pressable
            style={styles.navBtn}
            onPress={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            hitSlop={8}>
            <ChevronRight size={20} color={colors.ink700} />
          </Pressable>
        </View>

        {/* Weekday header */}
        <View style={styles.weekRow}>
          {WEEKDAYS.map((w, i) => (
            <View key={i} style={styles.cell}>
              <AppText variant="label" muted>
                {w}
              </AppText>
            </View>
          ))}
        </View>

        {/* Day grid */}
        <View style={styles.grid}>
          {cells.map((d, i) => {
            if (!d) return <View key={`b${i}`} style={styles.cell} />;
            const disabled = d < floor;
            const isSelected = toISODate(d) === value;
            const isToday = toISODate(d) === toISODate(today);
            return (
              <Pressable
                key={toISODate(d)}
                style={styles.cell}
                disabled={disabled}
                onPress={() => pick(d)}>
                <View style={[styles.day, isToday && !isSelected && styles.dayToday]}>
                  {isSelected ? (
                    <Gradient
                      colors={colors.brandGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  ) : null}
                  <AppText
                    variant="body"
                    color={
                      isSelected ? colors.white : disabled ? colors.ink300 : colors.ink800
                    }>
                    {d.getDate()}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: spacing.lg }} />
        <Button label="Done" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(12,20,35,0.35)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    ...shadow.floating,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  quickChip: {
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDisabled: { opacity: 0.5 },
  weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center', paddingVertical: 3 },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dayToday: { borderWidth: 1.5, borderColor: colors.brand },
});
