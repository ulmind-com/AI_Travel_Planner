import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useSocketNotifications } from '../hooks/useSocketNotifications';
import NotificationDropdown from './NotificationDropdown';
import { AnimatePresence } from 'framer-motion';

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    
    const {
        notifications,
        setNotifications,
        unreadCount,
        setUnreadCount,
        markAsRead,
        markAllRead
    } = useNotifications();

    // Hook up real-time dynamic socket events immediately
    useSocketNotifications(setNotifications, setUnreadCount);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative font-mono" ref={dropdownRef}>
            {/* Bell Icon Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl border transition-all flex items-center justify-center bg-white/[0.01] ${
                    isOpen 
                    ? 'border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]' 
                    : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                }`}
                title="Ecosystem activity signals"
            >
                <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                
                {/* Glowing alert badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 text-[8px] font-black text-white items-center justify-center font-mono select-none">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            <AnimatePresence>
                {isOpen && (
                    <NotificationDropdown
                        notifications={notifications}
                        onRead={markAsRead}
                        onReadAll={markAllRead}
                        onClose={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
