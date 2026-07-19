import React from 'react';
import { Heart, MessageSquare, UserPlus, Mail, AlertCircle, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationItem = ({ item, onRead }) => {
    const navigate = useNavigate();

    const getIcon = () => {
        switch (item.type) {
            case 'like_post':
            case 'like_story':
                return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />;
            case 'comment_post':
            case 'comment_story':
                return <MessageSquare className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />;
            case 'follow':
            case 'friend_request':
            case 'friend_accepted':
                return <UserPlus className="w-3.5 h-3.5 text-emerald-400" />;
            case 'message':
                return <Mail className="w-3.5 h-3.5 text-amber-400" />;
            default:
                return <Compass className="w-3.5 h-3.5 text-purple-400" />;
        }
    };

    const handleClick = () => {
        // Mark as read
        if (!item.isRead) {
            onRead(item._id);
        }

        // Navigate based on type
        switch (item.type) {
            case 'like_post':
            case 'comment_post':
                navigate(`/community/post/${item.relatedId}`);
                break;
            case 'message':
                navigate('/chat');
                break;
            case 'follow':
            case 'friend_request':
            case 'friend_accepted':
                navigate(`/profile/${item.sender?.username || ''}`);
                break;
            default:
                navigate('/community');
                break;
        }
    };

    const getRelativeTime = (dateString) => {
        const past = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - past) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const getText = () => {
        const name = item.sender?.fullname || item.sender?.username || 'Someone';
        switch (item.type) {
            case 'like_post':
                return <span><strong className="text-gray-100 font-bold">{name}</strong> liked your expedition post.</span>;
            case 'like_story':
                return <span><strong className="text-gray-100 font-bold">{name}</strong> loved your travel story.</span>;
            case 'comment_post':
                return <span><strong className="text-gray-100 font-bold">{name}</strong> commented: "{item.content || 'Great post!'}"</span>;
            case 'comment_story':
                return <span><strong className="text-gray-100 font-bold">{name}</strong> replied to your story.</span>;
            case 'follow':
                return <span><strong className="text-gray-100 font-bold">{name}</strong> started following you.</span>;
            case 'friend_request':
                return <span><strong className="text-gray-100 font-bold">{name}</strong> sent you a friend request.</span>;
            case 'friend_accepted':
                return <span><strong className="text-gray-100 font-bold">{name}</strong> accepted your friend request.</span>;
            case 'message':
                return <span><strong className="text-gray-100 font-bold">{name}</strong> sent you a direct signal.</span>;
            default:
                return <span>New activity triggered by <strong className="text-gray-100 font-bold">{name}</strong>.</span>;
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`flex items-start gap-3.5 p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer select-none ${
                !item.isRead ? 'bg-white/[0.01] border-l-2 border-l-emerald-500' : ''
            }`}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <img
                    src={item.sender?.profilepicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}
                    alt="sender avatar"
                    className="w-9 h-9 rounded-xl object-cover border border-white/10"
                />
                <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 bg-black border border-white/10 rounded-lg flex items-center justify-center shadow-lg">
                    {getIcon()}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
                <p className="text-[11px] text-gray-400 font-medium leading-relaxed font-sans">
                    {getText()}
                </p>
                <span className="text-[8px] text-gray-500 font-mono font-black uppercase tracking-widest block">
                    {getRelativeTime(item.createdAt)}
                </span>
            </div>

            {/* Unread dot */}
            {!item.isRead && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            )}
        </div>
    );
};

export default NotificationItem;
