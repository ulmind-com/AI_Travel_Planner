import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || '';

export const expenseService = {
    // Add a new group expense item
    addExpense: async (expenseData, token) => {
        const res = await axios.post(`${API_URL}/api/v1/expenses/add`, expenseData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // Fetch all expense items for a specific group
    getGroupExpenses: async (groupId, token) => {
        const res = await axios.get(`${API_URL}/api/v1/expenses/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // Fetch financial summary and settlements
    getExpenseSummary: async (groupId, token) => {
        const res = await axios.get(`${API_URL}/api/v1/expenses/summary/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // Trigger email notification with split PDF to all members
    sendExpenseReportEmail: async (groupId, token) => {
        const res = await axios.post(`${API_URL}/api/v1/expenses/summary/${groupId}/send-email`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // Update an existing expense
    updateExpense: async (expenseId, expenseData, token) => {
        const res = await axios.put(`${API_URL}/api/v1/expenses/${expenseId}`, expenseData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // Delete an expense
    deleteExpense: async (expenseId, token) => {
        const res = await axios.delete(`${API_URL}/api/v1/expenses/${expenseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // Fetch logged in user's expenses
    getUserExpenses: async (token) => {
        const res = await axios.get(`${API_URL}/api/v1/expenses/user`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // Fetch expense split graph data
    getExpenseGraph: async (groupId, token) => {
        const res = await axios.get(`${API_URL}/api/v1/expenses/graph/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    }
};
