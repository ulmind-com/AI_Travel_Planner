import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export const useNotifications = () => {
    const { getToken, isSignedIn } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!isSignedIn) return;
        setLoading(true);
        try {
            const token = await getToken();
            const res = await axios.get('/api/v1/social/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                const list = res.data.data || [];
                setNotifications(list);
                setUnreadCount(list.filter(n => !n.isRead).length);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, [getToken, isSignedIn]);

    const markAsRead = async (id) => {
        try {
            const token = await getToken();
            const res = await axios.patch(`/api/v1/social/notifications/read/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setNotifications(prev =>
                    prev.map(n => n._id === id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const markAllRead = async () => {
        try {
            const token = await getToken();
            const res = await axios.patch('/api/v1/social/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (err) {
            console.error('Failed to mark all notifications read:', err);
        }
    };

    useEffect(() => {
        if (isSignedIn) {
            fetchNotifications();
        }
    }, [isSignedIn, fetchNotifications]);

    return {
        notifications,
        setNotifications,
        loading,
        unreadCount,
        setUnreadCount,
        fetchNotifications,
        markAsRead,
        markAllRead
    };
};
