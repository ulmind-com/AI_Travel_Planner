import { useEffect } from 'react';
import { useSocket } from '../context/appContext';

export const useSocketNotifications = (setNotifications, setUnreadCount) => {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            // Prepend new real-time notification
            setNotifications(prev => {
                // Prevent duplicate records
                if (prev.some(n => n._id === notification._id)) return prev;
                return [notification, ...prev];
            });
            setUnreadCount(prev => prev + 1);
        };

        socket.on('notification:new', handleNewNotification);
        socket.on('notification', handleNewNotification);

        return () => {
            socket.off('notification:new', handleNewNotification);
            socket.off('notification', handleNewNotification);
        };
    }, [socket, setNotifications, setUnreadCount]);
};
