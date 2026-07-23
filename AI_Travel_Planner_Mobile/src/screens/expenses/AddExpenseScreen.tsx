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
import { useQuery } from '@tanstack/react-query';
import { Check, Users, X } from 'lucide-react-native';
import { AppText, Button, Card } from '../../components/ui';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { radius, shadow, spacing } from '../../theme';
import { getGroupById, getMyGroups } from '../../services/communityService';
import { addExpense } from '../../services/expensesService';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import type { MainStackScreenProps } from '../../navigation/types';

export function AddExpenseScreen({ navigation }: MainStackScreenProps<'AddExpense'>) {
  const { profile } = useAuth();
  const myId = profile?._id;

  const { data: groups, isLoading } = useQuery({ queryKey: ['my-groups'], queryFn: getMyGroups });
  const [groupId, setGroupId] = useState<string | null>(null);

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => getGroupById(groupId!),
    enabled: !!groupId,
  });
  const members: any[] = (group as any)?.members ?? [];

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError('');
    if (!groupId) return setError('Pick a travel group.');
    if (!myId) return setError('Profile not loaded yet, try again.');
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError('Enter a valid amount.');
    if (!description.trim()) return setError('Add a description.');
    const participants = (members.length ? members.map(m => m._id || m) : [myId]).filter(Boolean);

    setSaving(true);
    try {
      await addExpense({
        groupId,
        paidBy: myId,
        amount: amt,
        description: description.trim(),
        splitType: 'equal',
        participants,
      });
      queryClient.invalidateQueries({ queryKey: ['user-expenses'] });
      navigation.goBack();
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <X size={20} color={colors.ink700} />
        </Pressable>
        <AppText variant="h3">Add expense</AppText>
        <View style={styles.circle} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AppText variant="label" color={colors.ink600} style={styles.lbl}>
            TRAVEL GROUP
          </AppText>
          {isLoading ? (
            <AppText variant="body" muted>
              Loading your groups…
            </AppText>
          ) : (groups ?? []).length === 0 ? (
            <Card style={styles.noGroup} rounded="xl">
              <Users size={22} color={colors.brand} />
              <AppText variant="body" muted style={{ flex: 1 }}>
                Join or create a travel group first to split expenses.
              </AppText>
              <Pressable onPress={() => navigation.navigate('Groups')}>
                <AppText variant="bodyStrong" color={colors.brand}>
                  Groups
                </AppText>
              </Pressable>
            </Card>
          ) : (
            <View style={styles.groupList}>
              {(groups ?? []).map(g => (
                <Pressable
                  key={g._id}
                  style={[styles.groupChip, groupId === g._id && styles.groupChipActive]}
                  onPress={() => setGroupId(g._id)}>
                  {groupId === g._id ? <Check size={16} color={colors.white} /> : null}
                  <AppText variant="bodyStrong" color={groupId === g._id ? colors.white : colors.ink700}>
                    {g.name}
                  </AppText>
                </Pressable>
              ))}
            </View>
          )}

          {group && members.length > 0 ? (
            <AppText variant="label" muted style={{ marginTop: spacing.md }}>
              Splitting equally among {members.length} members
            </AppText>
          ) : null}

          <AppText variant="label" color={colors.ink600} style={styles.lbl}>
            AMOUNT
          </AppText>
          <TextInput
            style={styles.amount}
            placeholder="0.00"
            placeholderTextColor={colors.ink300}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          <AppText variant="label" color={colors.ink600} style={styles.lbl}>
            DESCRIPTION
          </AppText>
          <TextInput
            style={styles.input}
            placeholder="Dinner, taxi, hotel…"
            placeholderTextColor={colors.ink400}
            value={description}
            onChangeText={setDescription}
          />

          {error ? (
            <AppText variant="caption" color={colors.danger} style={{ marginTop: spacing.md }}>
              {error}
            </AppText>
          ) : null}
          <View style={{ height: spacing.xl }} />
          <Button label="Add expense" loading={saving} onPress={submit} />
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  lbl: { marginTop: spacing.xl, marginBottom: spacing.md, marginLeft: 4, letterSpacing: 1 },
  noGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.brandSoft,
    ...shadow.sm,
  },
  groupList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  groupChipActive: { backgroundColor: colors.brand },
  amount: {
    height: 64,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 18,
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink900,
  },
  input: {
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink900,
  },
});
