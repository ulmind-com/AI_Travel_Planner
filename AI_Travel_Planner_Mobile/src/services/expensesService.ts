import api from '../lib/api';

export interface Expense {
  _id: string;
  groupId?: string;
  paidBy?: any;
  amount?: number;
  description?: string;
  splitType?: string;
  participants?: any[];
  currency?: string;
  createdAt?: string;
}

export interface ExpenseSummary {
  totalSpent?: number;
  balances?: { user?: any; amount?: number }[];
  settlements?: { from?: any; to?: any; amount?: number }[];
  [key: string]: any;
}

export async function getUserExpenses(): Promise<Expense[]> {
  const { data } = await api.get('/expenses/user');
  return (data?.data ?? data ?? []) as Expense[];
}

export async function getGroupExpenses(groupId: string): Promise<Expense[]> {
  const { data } = await api.get(`/expenses/group/${groupId}`);
  return (data?.data ?? data ?? []) as Expense[];
}

export async function getGroupSummary(groupId: string): Promise<ExpenseSummary> {
  const { data } = await api.get(`/expenses/summary/${groupId}`);
  return (data?.data ?? data ?? {}) as ExpenseSummary;
}

export async function addExpense(input: {
  groupId: string;
  paidBy: string;
  amount: number;
  description: string;
  splitType: string;
  participants: string[];
  splitDetails?: any;
}): Promise<any> {
  const { data } = await api.post('/expenses/add', input);
  return data;
}
