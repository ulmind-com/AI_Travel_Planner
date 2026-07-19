import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || '';

export const profileService = {
    // 1. Get profile & dynamic stats
    getProfile: async (firebaseUid, token) => {
        const res = await axios.get(`${API_URL}/api/v1/users/${firebaseUid}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // 2. Get user posts
    getPosts: async (firebaseUid, token) => {
        const res = await axios.get(`${API_URL}/api/v1/users/${firebaseUid}/posts`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // 3. Get user experiences
    getExperiences: async (firebaseUid, token) => {
        const res = await axios.get(`${API_URL}/api/v1/users/${firebaseUid}/experiences`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // 4. Get user comments
    getComments: async (firebaseUid, token) => {
        const res = await axios.get(`${API_URL}/api/v1/users/${firebaseUid}/comments`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // 5. Get user liked posts
    getLikes: async (firebaseUid, token) => {
        const res = await axios.get(`${API_URL}/api/v1/users/${firebaseUid}/likes`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // 6. Get user groups
    getGroups: async (firebaseUid, token) => {
        const res = await axios.get(`${API_URL}/api/v1/users/${firebaseUid}/groups`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // 7. Update profile details (Form data with optional profile image)
    updateProfile: async (formData, token) => {
        const res = await axios.put(`${API_URL}/api/v1/users/update`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        return res.data;
    },

    // 8. Delete post
    deletePost: async (postId, token) => {
        const res = await axios.delete(`${API_URL}/api/v1/community/posts/${postId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // 9. Delete comment
    deleteComment: async (commentId, token) => {
        const res = await axios.delete(`${API_URL}/api/v1/community/comments/${commentId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    }
};
