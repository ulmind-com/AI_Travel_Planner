import axios from 'axios';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_BACKEND_URL || 'https://adventure-nexus-backend.onrender.com')}/api/v1/admin`,
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401s (e.g. token expired or invalid)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear invalid token
            localStorage.removeItem('adminToken');
            // Redirect to login if not already there
            if (window.location.pathname !== '/admin/login') {
                window.location.href = '/admin/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
