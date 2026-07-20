import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Receipt, Wallet } from 'lucide-react-native';
import { AppText, Card } from '../../components/ui';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme';
import { getUserExpenses } from '../../services/expensesService';
import type { MainStackScreenProps } from '../../navigation/types';

export function ExpensesScreen({ navigation }: MainStackScreenProps<'Expenses'>) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['user-expenses'],
    queryFn: getUserExpenses,
  });

  const total = (data ?? []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.ink800} />
        </Pressable>
        <AppText variant="h3">Expenses</AppText>
        <Pressable style={styles.circle} onPress={() => navigation.navigate('AddExpense')} hitSlop={10}>
          <Plus size={20} color={colors.brand} />
        </Pressable>
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <Card style={styles.summary} rounded="xxl">
            <View style={styles.summaryIcon}>
              <Wallet size={24} color={colors.white} />
            </View>
            <AppText variant="caption" color="rgba(255,255,255,0.85)">
              Your total tracked
            </AppText>
            <AppText variant="hero" color={colors.white}>
              ${Math.round(total).toLocaleString()}
            </AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.85)">
              across {(data ?? []).length} entries
            </AppText>
          </Card>
        }
        renderItem={({ item }) => {
          const payer =
            typeof item.paidBy === 'object' ? item.paidBy?.username || item.paidBy?.fullname : undefined;
          return (
            <Card style={styles.row} rounded="lg">
              <View style={styles.rowIcon}>
                <Receipt size={18} color={colors.green} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {item.description || 'Expense'}
                </AppText>
                <AppText variant="caption" muted>
                  {item.splitType ? `${item.splitType} split` : 'Split'}
                  {payer ? ` · paid by ${payer}` : ''}
                </AppText>
              </View>
              <AppText variant="bodyStrong" color={colors.ink900}>
                {item.currency === 'INR' ? '₹' : '$'}
                {Math.round(Number(item.amount) || 0).toLocaleString()}
              </AppText>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText variant="h3" center>
              {isLoading ? 'Loading…' : 'No expenses yet'}
            </AppText>
            <AppText variant="body" muted center style={{ marginTop: 6 }}>
              Group trip expenses and settle-ups will appear here.
            </AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
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
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  summary: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.green,
    marginBottom: spacing.xl,
    paddingVertical: spacing.xxl,
    ...shadow.md,
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { paddingTop: spacing.huge, alignItems: 'center', paddingHorizontal: spacing.xl },
});
