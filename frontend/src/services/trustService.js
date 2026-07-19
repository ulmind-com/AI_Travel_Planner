import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || '';

export const trustService = {
    // Fetch dynamic trust score profile for a user
    getUserTrustProfile: async (userId, token) => {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_URL}/api/v1/trust/${userId}`, { headers });
        return res.data;
    },

    // Admin: Get flagged content moderation logs
    getFlaggedContent: async (token, page = 1, limit = 20) => {
        const res = await axios.get(`${API_URL}/api/v1/admin/flagged-content?page=${page}&limit=${limit}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // Admin: Ban or unban user
    banUser: async (userId, isBanned, banReason, token) => {
        const res = await axios.post(`${API_URL}/api/v1/admin/ban-user/${userId}`, { isBanned, banReason }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // Admin: Manually penalize/reduce a user's trust score
    reduceTrustScore: async (userId, penaltyAmount, reason, token) => {
        const res = await axios.post(`${API_URL}/api/v1/admin/reduce-trust/${userId}`, { penaltyAmount, reason }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // Admin: Delete flagged content from the platform database
    deleteFlaggedContent: async (logId, token) => {
        const res = await axios.delete(`${API_URL}/api/v1/admin/content/${logId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    }
};
