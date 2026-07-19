import React from 'react';
import NotificationItem from './NotificationItem';
import { Check, ShieldAlert, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const NotificationDropdown = ({ notifications, onRead, onReadAll, onClose }) => {
    
    // Group notifications by time
    const getGroupedNotifications = () => {
        const today = [];
        const yesterday = [];
        const earlier = [];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

        notifications.forEach(item => {
            const itemDate = new Date(item.createdAt);
            if (itemDate >= startOfToday) {
                today.push(item);
            } else if (itemDate >= startOfYesterday) {
                yesterday.push(item);
            } else {
                earlier.push(item);
            }
        });

        return { today, yesterday, earlier };
    };

    const { today, yesterday, earlier } = getGroupedNotifications();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-card/95 backdrop-blur-md border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden z-50 font-mono"
        >
            {/* Header controls */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">Nexus Signal Core</span>
                </div>
                <button
                    onClick={onReadAll}
                    className="flex items-center gap-1.5 text-[8px] font-black text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/5 px-2.5 py-1 rounded-full transition-all uppercase tracking-widest"
                >
                    <Check className="w-3 h-3" />
                    Clear Inbox
                </button>
            </div>

            {/* List scroll grid */}
            <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3 opacity-40">
                        <ShieldAlert className="w-10 h-10 text-gray-600 animate-pulse" />
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest text-center px-4">
                            All channels silent // no incoming activity logs detected
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {/* Today's notifications */}
                        {today.length > 0 && (
                            <div>
                                <div className="px-5 py-2.5 bg-white/[0.02] text-[8px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                                    Today's Activity
                                </div>
                                {today.map(item => (
                                    <NotificationItem key={item._id} item={item} onRead={onRead} />
                                ))}
                            </div>
                        )}

                        {/* Yesterday's notifications */}
                        {yesterday.length > 0 && (
                            <div>
                                <div className="px-5 py-2.5 bg-white/[0.02] text-[8px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                                    Yesterday's Telemetry
                                </div>
                                {yesterday.map(item => (
                                    <NotificationItem key={item._id} item={item} onRead={onRead} />
                                ))}
                            </div>
                        )}

                        {/* Earlier notifications */}
                        {earlier.length > 0 && (
                            <div>
                                <div className="px-5 py-2.5 bg-white/[0.02] text-[8px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                                    Historical Logs
                                </div>
                                {earlier.map(item => (
                                    <NotificationItem key={item._id} item={item} onRead={onRead} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer summary */}
            <div className="px-5 py-3 border-t border-white/5 bg-white/[0.01] text-center">
                <span className="text-[7px] text-gray-600 font-black uppercase tracking-widest">
                    Security verified // 128-bit SSL encrypted connection
                </span>
            </div>
        </motion.div>
    );
};

export default NotificationDropdown;
