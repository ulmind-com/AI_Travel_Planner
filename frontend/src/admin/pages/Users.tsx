import React, { useEffect, useState } from 'react';
import api from '../services/adminApi';
import { 
    Trash2, Search, User as UserIcon, Mail, Calendar, 
    Activity, Clock, Eye, ShieldCheck, RefreshCw, AlertTriangle, 
    MapPin, FileText, MessageSquare, ShieldAlert, Award, Globe, Link as LinkIcon 
} from 'lucide-react';
import { useSocket } from '../context/AdminSocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import DetailPanel from '../components/DetailPanel';
import SocialGraph from '../components/SocialGraph';

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [banReasonInput, setBanReasonInput] = useState('');
    const [showBanModal, setShowBanModal] = useState<any | null>(null);
    const { socket } = useSocket();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users');
            setUsers(res.data.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();

        if (socket) {
            socket.emit('get-online-users');
            socket.on('online-users-list', (ids: string[]) => setOnlineUserIds(new Set(ids)));
            socket.on('user:online', (id: string) => setOnlineUserIds(prev => new Set(prev).add(id)));
            socket.on('user:offline', (id: string) => setOnlineUserIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            }));
            socket.on('user:created', () => fetchUsers());
            socket.on('user:deleted', (firebaseUid: string) => {
                setUsers(prev => prev.filter(u => u.firebaseUid !== firebaseUid));
            });
            socket.on('user:ban_status_changed', ({ firebaseUid, isBanned }: any) => {
                setUsers(prev => prev.map(u => u.firebaseUid === firebaseUid ? { ...u, isBanned } : u));
            });

            return () => {
                socket.off('online-users-list');
                socket.off('user:online');
                socket.off('user:offline');
                socket.off('user:created');
                socket.off('user:deleted');
                socket.off('user:ban_status_changed');
            };
        }
    }, [socket]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('WARNING: Irreversibly delete this user? All their comments, posts, likes, and group memberships will be permanently deleted from MongoDB and Cloudinary.')) return;
        try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
            if (selectedUser?._id === id) setSelectedUser(null);
        } catch (error) {
            alert('Operation failed');
        }
    };

    const handleToggleBan = async (user: any, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        
        // If banning and no reason modal, open it first
        if (!user.isBanned && !banReasonInput && !showBanModal) {
            setShowBanModal(user);
            return;
        }

        try {
            const reason = banReasonInput || 'Violated community guidelines';
            const res = await api.post(`/users/${user._id}/ban`, { reason });
            const updatedUser = res.data.data;
            
            setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isBanned: updatedUser.isBanned, banReason: updatedUser.banReason } : u));
            if (selectedUser?._id === user._id) {
                setSelectedUser({ ...selectedUser, isBanned: updatedUser.isBanned, banReason: updatedUser.banReason });
            }
            
            setShowBanModal(null);
            setBanReasonInput('');
        } catch (error) {
            alert('Failed to toggle ban status');
        }
    };

    const getRelativeTime = (date: string) => {
        const now = new Date();
        const past = new Date(date);
        if (!date) return 'Unknown';
        const diff = Math.floor((now.getTime() - past.getTime()) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return past.toLocaleDateString();
    };

    // Calculate aggregated statistics dynamically for overview cards
    const totalTravelers = users.length;
    const onlineCount = users.filter(u => onlineUserIds.has(u.firebaseUid)).length;
    const totalPlans = users.reduce((sum, u) => sum + (u.plansCount || 0), 0);
    const totalContributions = users.reduce((sum, u) => sum + (u.postsCount || 0) + (u.commentsCount || 0), 0);
    const bannedCount = users.filter(u => u.isBanned).length;

    // Filter Logic
    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            user.username?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase()) ||
            user.fullname?.toLowerCase().includes(search.toLowerCase());
            
        const matchesRole = 
            roleFilter === 'all' || 
            (roleFilter === 'admin' && user.role === 'admin') ||
            (roleFilter === 'user' && user.role === 'user');

        const isOnline = onlineUserIds.has(user.firebaseUid);
        const matchesStatus = 
            statusFilter === 'all' ||
            (statusFilter === 'online' && isOnline) ||
            (statusFilter === 'banned' && user.isBanned) ||
            (statusFilter === 'active' && ((user.plansCount || 0) > 0 || (user.postsCount || 0) > 0));

        return matchesSearch && matchesRole && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-white gap-3 font-sans">
                <span className="w-8 h-8 border-2 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 animate-pulse">Synchronizing Operators Logs...</span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 pb-20 select-none font-sans"
        >
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-b-white/5 pb-6">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-emerald-400" />
                        <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">
                            Ecosystem Operators <span className="text-emerald-400">Database</span>
                        </h1>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        Active community user node directories and online status triggers
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchUsers}
                        className="flex items-center gap-2 px-5 py-2.5 border border-white/10 hover:border-white/20 rounded-full text-[10px] font-bold text-gray-400 hover:text-white bg-white/[0.01] hover:bg-white/[0.03] transition-all uppercase tracking-widest"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Sync Operators
                    </button>
                </div>
            </div>

            {/* Premium Dynamic Overview Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Total Profiles</span>
                        <span className="text-2xl font-black text-white">{totalTravelers}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <UserIcon className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Online Operators</span>
                        <span className="text-2xl font-black text-emerald-400 flex items-center gap-2">
                            {onlineCount}
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping inline-block"></span>
                        </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Activity className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Travel Plans</span>
                        <span className="text-2xl font-black text-white">{totalPlans}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Calendar className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Contributions</span>
                        <span className="text-2xl font-black text-white">{totalContributions}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        <FileText className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Restricted Nodes</span>
                        <span className="text-2xl font-black text-rose-500">{bannedCount}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                        <ShieldAlert className="w-4 h-4 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Premium Social follower relationships network graph */}
            <SocialGraph 
                users={users} 
                onlineUserIds={onlineUserIds} 
                onSelectUser={setSelectedUser} 
            />

            {/* Filter controls row */}
            <div className="flex flex-col md:flex-row gap-4 bg-card/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-lg">
                <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2 flex-grow">
                    <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Search by name, registered username, or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent text-xs text-gray-200 focus:outline-none w-full placeholder:text-gray-600"
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Role Filter */}
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-card border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-400 hover:text-white focus:outline-none cursor-pointer"
                    >
                        <option value="all">ALL ROLES</option>
                        <option value="admin">ADMINISTRATORS</option>
                        <option value="user">STANDARD TRAVELERS</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-card border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-400 hover:text-white focus:outline-none cursor-pointer"
                    >
                        <option value="all">ALL STATUSES</option>
                        <option value="online">ONLINE NOW</option>
                        <option value="banned">RESTRICTED / BANNED</option>
                        <option value="active">ACTIVE GENERATORS</option>
                    </select>
                </div>
            </div>

            {/* Users grid list */}
            <div className="bg-card/80 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-indigo-600"></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/[0.02] border-b border-white/10">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Operator Identity</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Contact & Role</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Telemetry Statistics</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Connection</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Inspect</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs">
                            {filteredUsers.map((user) => {
                                const isOnline = onlineUserIds.has(user.firebaseUid);
                                return (
                                    <tr
                                        key={user._id}
                                        onClick={() => setSelectedUser(user)}
                                        className="hover:bg-white/[0.01] transition-colors group cursor-pointer"
                                    >
                                        {/* Operator Identity */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <img
                                                        src={user.profilepicture || `https://ui-avatars.com/api/?name=${user.username}&background=10b981&color=fff`}
                                                        alt={user.username}
                                                        className="w-10 h-10 rounded-xl object-cover border border-white/10 group-hover:border-emerald-500/50 transition-all duration-300"
                                                    />
                                                    {isOnline && (
                                                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-4 border-card rounded-full animate-pulse shadow-lg shadow-emerald-500/30"></span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-gray-200 font-extrabold tracking-tight text-sm flex items-center gap-1.5">
                                                        {user.fullname || user.username}
                                                        {user.isBanned && (
                                                            <span className="px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[8px] border border-rose-500/20 font-black tracking-widest">BANNED</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact & Role */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 text-gray-300 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span className="text-[11px] font-semibold">{user.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest border ${
                                                        user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-gray-400 border-white/5'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                    {user.country && (
                                                        <span className="flex items-center gap-1 text-[9px] text-gray-400 uppercase tracking-widest">
                                                            <MapPin className="w-3 h-3 text-rose-400" />
                                                            {user.country}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Telemetry statistics (PLANS, POSTS, COMMENTS, REVIEWS) */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <div className="flex items-center gap-1 bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{user.plansCount || 0} plans</span>
                                                </div>
                                                <div className="flex items-center gap-1 bg-purple-500/5 border border-purple-500/10 text-purple-400 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                                                    <FileText className="w-3 h-3" />
                                                    <span>{user.postsCount || 0} posts</span>
                                                </div>
                                                <div className="flex items-center gap-1 bg-amber-500/5 border border-amber-500/10 text-amber-400 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                                                    <MessageSquare className="w-3 h-3" />
                                                    <span>{user.commentsCount || 0} comments</span>
                                                </div>
                                                <div className="flex items-center gap-1 bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                                                    <Award className="w-3 h-3" />
                                                    <span>{user.reviewsCount || 0} reviews</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Live connection / active state */}
                                        <td className="px-6 py-4">
                                            {user.isBanned ? (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 rounded-full w-fit text-rose-500 font-bold uppercase tracking-widest text-[9px]">
                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                    <span>SUSPENDED</span>
                                                </div>
                                            ) : isOnline ? (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit text-emerald-400 font-bold uppercase tracking-widest text-[9px]">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                                                    <span>ONLINE</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">OFFLINE NODE</span>
                                                    <span className="text-[9px] text-gray-500 font-medium mt-0.5">Seen {getRelativeTime(user.lastActive || user.updatedAt)}</span>
                                                </div>
                                            )}
                                        </td>

                                        {/* INSPECT ACTION */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}
                                                    title="Inspect Dossier"
                                                    className="p-2 rounded-lg border border-white/5 hover:border-white/20 text-gray-400 hover:text-white bg-white/[0.01] hover:bg-white/[0.03] transition-all"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                
                                                <button
                                                    onClick={(e) => handleToggleBan(user, e)}
                                                    title={user.isBanned ? 'Unban Account' : 'Restrict Account'}
                                                    className={`p-2 rounded-lg border transition-all ${
                                                        user.isBanned 
                                                        ? 'border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 bg-emerald-500/5' 
                                                        : 'border-white/5 hover:border-rose-500/20 text-gray-400 hover:text-rose-500 hover:bg-rose-500/5'
                                                    }`}
                                                >
                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                    onClick={(e) => handleDelete(user._id, e)}
                                                    title="Permanently Expunge User"
                                                    className="p-2 rounded-lg border border-white/5 hover:border-rose-500/20 text-gray-400 hover:text-rose-500 bg-white/[0.01] hover:bg-rose-500/5 transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center flex flex-col items-center justify-center gap-3">
                                        <UserIcon className="w-10 h-10 text-gray-700 animate-pulse" />
                                        <p className="text-gray-500 text-xs font-black uppercase tracking-widest">No operator registries matched your queries</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User detail dossier */}
            <DetailPanel
                isOpen={!!selectedUser}
                onClose={() => setSelectedUser(null)}
                title="Operator Dossier"
                description={`Verification statistics for community node @${selectedUser?.username}`}
            >
                {selectedUser && (
                    <div className="space-y-6 select-none font-sans">
                        {/* Avatar block */}
                        <div className="flex items-center gap-5 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                            <div className="relative">
                                <img
                                    src={selectedUser.profilepicture || `https://ui-avatars.com/api/?name=${selectedUser.username}&background=10b981&color=fff`}
                                    alt={selectedUser.username}
                                    className="w-16 h-16 rounded-xl object-cover border border-white/10"
                                />
                                {onlineUserIds.has(selectedUser.firebaseUid) && (
                                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-card rounded-full animate-pulse"></span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white leading-tight">{selectedUser.fullname || selectedUser.username}</h3>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span className="text-[10px] text-emerald-400 font-extrabold">@{selectedUser.username}</span>
                                    <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-widest ${
                                        selectedUser.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-gray-400 border-white/5'
                                    }`}>
                                        {selectedUser.role}
                                    </span>
                                    {selectedUser.country && (
                                        <>
                                            <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-rose-500" />
                                                {selectedUser.country}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-1">
                                <Activity className="w-4 h-4 text-emerald-400" />
                                <span className="text-gray-500 text-[8px] font-black uppercase tracking-widest block mt-1">Status Status</span>
                                <span className={`font-black text-[10px] uppercase ${selectedUser.isBanned ? 'text-rose-500' : 'text-emerald-400'}`}>
                                    {selectedUser.isBanned ? 'RESTRICTED / BANNED' : onlineUserIds.has(selectedUser.firebaseUid) ? 'ONLINE' : 'OFFLINE'}
                                </span>
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-1">
                                <Clock className="w-4 h-4 text-cyan-400" />
                                <span className="text-gray-500 text-[8px] font-black uppercase tracking-widest block mt-1">Last Active Signal</span>
                                <span className="text-white font-black text-[10px] uppercase">{getRelativeTime(selectedUser.lastActive || selectedUser.updatedAt)}</span>
                            </div>
                        </div>

                        {/* User Bio and Preferences */}
                        {(selectedUser.bio || (selectedUser.preferences && selectedUser.preferences.length > 0)) && (
                            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4">
                                {selectedUser.bio && (
                                    <div className="space-y-1">
                                        <span className="text-gray-500 text-[8px] font-black uppercase tracking-widest block">Biography / Travel Ethos</span>
                                        <p className="text-xs text-gray-300 italic leading-relaxed">"{selectedUser.bio}"</p>
                                    </div>
                                )}
                                {selectedUser.preferences && selectedUser.preferences.length > 0 && (
                                    <div className="space-y-2 border-t border-white/5 pt-3">
                                        <span className="text-gray-500 text-[8px] font-black uppercase tracking-widest block">Travel Preferences</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedUser.preferences.map((pref: string, pIdx: number) => (
                                                <span 
                                                    key={pIdx}
                                                    className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[8px] font-black tracking-widest uppercase"
                                                >
                                                    {pref}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Aggregated Statistics Dossier */}
                        <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Ecosystem Activity Audit</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-indigo-500/[0.02] border border-indigo-500/10 p-4 rounded-xl text-center space-y-1">
                                    <span className="text-2xl font-black text-indigo-400 leading-none">{selectedUser.plansCount || 0}</span>
                                    <span className="text-[8px] text-gray-500 font-bold block uppercase tracking-widest">Plans</span>
                                </div>
                                <div className="bg-purple-500/[0.02] border border-purple-500/10 p-4 rounded-xl text-center space-y-1">
                                    <span className="text-2xl font-black text-purple-400 leading-none">{selectedUser.postsCount || 0}</span>
                                    <span className="text-[8px] text-gray-500 font-bold block uppercase tracking-widest">Posts</span>
                                </div>
                                <div className="bg-amber-500/[0.02] border border-amber-500/10 p-4 rounded-xl text-center space-y-1">
                                    <span className="text-2xl font-black text-amber-400 leading-none">{selectedUser.commentsCount || 0}</span>
                                    <span className="text-[8px] text-gray-500 font-bold block uppercase tracking-widest">Comments</span>
                                </div>
                                <div className="bg-cyan-500/[0.02] border border-cyan-500/10 p-4 rounded-xl text-center space-y-1">
                                    <span className="text-2xl font-black text-cyan-400 leading-none">{selectedUser.reviewsCount || 0}</span>
                                    <span className="text-[8px] text-gray-500 font-bold block uppercase tracking-widest">Reviews</span>
                                </div>
                            </div>
                        </div>

                        {/* Telemetry specifications */}
                        <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Operator Registry Specifications</span>
                            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-3.5 text-xs text-gray-300">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 text-[8px] font-black uppercase tracking-widest">Ecosystem Mail</span>
                                    <span className="text-gray-200 font-bold">{selectedUser.email}</span>
                                </div>
                                {selectedUser.phonenumber && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-[8px] font-black uppercase tracking-widest">Telephone Node</span>
                                        <span className="text-gray-200 font-bold">+{selectedUser.phonenumber}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 text-[8px] font-black uppercase tracking-widest">Firebase Node ID</span>
                                    <code className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">{selectedUser.firebaseUid}</code>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 text-[8px] font-black uppercase tracking-widest">Account Created</span>
                                    <span className="text-gray-200 font-bold">{new Date(selectedUser.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 text-[8px] font-black uppercase tracking-widest">E2EE PublicKey</span>
                                    <code className="text-[8px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded tracking-tighter truncate max-w-[200px]" title={selectedUser.e2eePublicKey || 'N/A'}>
                                        {selectedUser.e2eePublicKey ? `${selectedUser.e2eePublicKey.substring(0, 16)}...` : 'UNREGISTERED'}
                                    </code>
                                </div>
                                
                                {/* Social Links */}
                                {selectedUser.socialLinks && (selectedUser.socialLinks.twitter || selectedUser.socialLinks.instagram || selectedUser.socialLinks.website) && (
                                    <div className="flex flex-col gap-2 border-t border-white/5 pt-3 mt-1">
                                        <span className="text-gray-500 text-[8px] font-black uppercase tracking-widest">Social Broadcast Hubs</span>
                                        <div className="flex items-center gap-4 text-[10px] font-bold">
                                            {selectedUser.socialLinks.website && (
                                                <a href={selectedUser.socialLinks.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
                                                    <Globe className="w-3.5 h-3.5" />
                                                    <span>WEBSITE</span>
                                                </a>
                                            )}
                                            {selectedUser.socialLinks.twitter && (
                                                <a href={`https://twitter.com/${selectedUser.socialLinks.twitter}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sky-400 hover:text-sky-300">
                                                    <LinkIcon className="w-3.5 h-3.5" />
                                                    <span>TWITTER</span>
                                                </a>
                                            )}
                                            {selectedUser.socialLinks.instagram && (
                                                <a href={`https://instagram.com/${selectedUser.socialLinks.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-pink-400 hover:text-pink-300">
                                                    <LinkIcon className="w-3.5 h-3.5" />
                                                    <span>INSTAGRAM</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ban / Suspension Status Section */}
                        {selectedUser.isBanned && (
                            <div className="bg-rose-500/10 border border-rose-500/30 p-5 rounded-2xl space-y-2">
                                <span className="text-rose-500 text-[9px] font-black uppercase tracking-widest block">Active Sanctions Dossier</span>
                                <div className="text-xs text-rose-300">
                                    <span className="font-bold">Reason:</span> "{selectedUser.banReason || 'No reason provided'}"
                                </div>
                            </div>
                        )}

                        {/* Danger zone actions */}
                        <div className="bg-rose-500/[0.02] border border-rose-500/10 p-5 rounded-2xl space-y-3.5">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 animate-pulse" />
                                <div>
                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Danger Zone Clearance Enforced</span>
                                    <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-1">
                                        Ban operations restrict system entry. Expunging accounts will permanently wipe Mongo databases, travel plans, and posts.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleToggleBan(selectedUser)}
                                    className={`flex-1 py-3 border rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                                        selectedUser.isBanned
                                        ? 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border-emerald-500/20'
                                        : 'bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border-rose-500/20'
                                    }`}
                                >
                                    {selectedUser.isBanned ? 'Revoke Account Restriction' : 'Enforce Restriction (Ban)'}
                                </button>
                                
                                <button
                                    onClick={(e) => handleDelete(selectedUser._id, e)}
                                    className="py-3 px-6 bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                                >
                                    Expunge Account
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </DetailPanel>

            {/* Custom Ban Reason Modal */}
            <AnimatePresence>
                {showBanModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4"
                        >
                            <div className="flex items-center gap-3 text-rose-500">
                                <ShieldAlert className="w-6 h-6 animate-pulse" />
                                <h3 className="text-sm font-black uppercase tracking-wider">Restrict Traveler Account</h3>
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                                Enforcing a profile restriction blocks traveler entry to AdventureNexus. Provide a reason to log in client audit files:
                            </p>
                            
                            <textarea
                                value={banReasonInput}
                                onChange={(e) => setBanReasonInput(e.target.value)}
                                placeholder="e.g. Disseminating inappropriate content, toxic itinerary notes..."
                                className="w-full h-24 bg-black border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                            />
                            
                            <div className="flex justify-end gap-3 text-[10px] font-black uppercase tracking-wider">
                                <button 
                                    onClick={() => { setShowBanModal(null); setBanReasonInput(''); }}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleToggleBan(showBanModal)}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all"
                                >
                                    Restrict User Node
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default UsersPage;
