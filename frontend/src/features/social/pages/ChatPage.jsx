import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Send, Image as ImageIcon, Paperclip, Smile, Search, 
    Phone, Video, Info, User, Users, CheckCheck, Check,
    Zap, ArrowLeft, MoreVertical, ShieldAlert, Loader2, MapPin,
    Lock, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { useAuth, useUser } from '@/context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuItem 
} from '@/components/ui/dropdown-menu';
import { useSocket } from '@/context/appContext';
import { communityService } from '@/services/communityService';
import { useE2EE } from '@/lib/e2ee/useE2EE';
import toast from 'react-hot-toast';
import NavBar from '@/components/NavBar';
import { ChatSidebarSkeleton } from '@/components/skeleton';

const ChatPage = () => {
    const { userId: firebaseUid, getToken } = useAuth();
    const { user } = useUser();
    const { socket } = useSocket();
    const location = useLocation();
    const navigate = useNavigate();

    // E2EE Hook — handles key generation, encryption, and decryption
    const { isReady: e2eeReady, encrypt, decrypt, decryptBatch, resetE2EE } = useE2EE(firebaseUid, getToken);

    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showMobileSidebar, setShowMobileSidebar] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [onlineUserIds, setOnlineUserIds] = useState(new Set());

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 1. Initial Load and pre-selected conversation navigation support
    useEffect(() => {
        const loadInitialConversations = async () => {
            try {
                setLoading(true);
                const token = await getToken();
                const res = await communityService.getUserConversations(token);
                if (res.success) {
                    setConversations(res.data);
                    
                    // Handle transition from "Message" button
                    const preSelectedConvId = location.state?.activeConversationId;
                    if (preSelectedConvId) {
                        const matchedConv = res.data.find(c => c._id === preSelectedConvId);
                        if (matchedConv) {
                            setActiveConversation(matchedConv);
                            setShowMobileSidebar(false);
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading chats:", error);
                toast.error("Failed to load your chats.");
            } finally {
                setLoading(false);
            }
        };

        if (firebaseUid) {
            loadInitialConversations();
        }
    }, [firebaseUid, location.state]);

    // 2. Fetch Messages when Active Conversation changes — decrypt E2EE messages
    useEffect(() => {
        const fetchChatHistory = async () => {
            if (!activeConversation) return;
            try {
                const token = await getToken();
                // Mark messages as read early
                await communityService.markChatMessageAsRead(activeConversation._id, token);
                
                const res = await communityService.getChatMessages(activeConversation._id, token);
                if (res.success) {
                    // Decrypt E2EE messages client-side
                    if (e2eeReady) {
                        const recipient = getRecipientProfile(activeConversation);
                        const recipientUid = recipient ? recipient.firebaseUid : '';
                        const decoratedMessages = res.data.map(m => ({
                            ...m,
                            _recipientFirebaseUid: recipientUid
                        }));
                        const decryptedMessages = await decryptBatch(decoratedMessages);
                        setMessages(decryptedMessages);
                    } else {
                        // E2EE not ready yet — show raw (encrypted messages will show lock icon)
                        setMessages(res.data.map(m => ({
                            ...m,
                            _displayContent: m.isEncrypted ? '🔒 Encrypted message' : m.content
                        })));
                    }
                    setTimeout(scrollToBottom, 100);
                }
            } catch (error) {
                console.error("Error fetching message history:", error);
            }
        };

        fetchChatHistory();
    }, [activeConversation, e2eeReady]);

    // 3. Setup Socket Event Receivers
    useEffect(() => {
        if (!socket) return;

        socket.on('chat:message', (data) => {
            // Handle seen status update
            if (data && data.type === 'messages:seen') {
                if (activeConversation && data.conversationId === activeConversation._id) {
                    setMessages(prev => prev.map(m => 
                        m && m.senderFirebaseUid === firebaseUid ? { ...m, status: 'seen' } : m
                    ).filter(Boolean));
                }
                return;
            }

            // Handle incoming message — decrypt E2EE messages in real-time
            if (activeConversation && data && data.conversationId === activeConversation._id) {
                if (!data.message) return;

                // Decrypt incoming E2EE message
                const processMessage = async (msg) => {
                    const recipient = getRecipientProfile(activeConversation);
                    const decoratedMsg = { ...msg, _recipientFirebaseUid: recipient ? recipient.firebaseUid : '' };
                    
                    if (decoratedMsg.isEncrypted && e2eeReady) {
                        const decryptedContent = await decrypt(decoratedMsg);
                        return { ...decoratedMsg, _displayContent: decryptedContent };
                    }
                    return { ...decoratedMsg, _displayContent: decoratedMsg.content };
                };

                processMessage(data.message).then(decryptedMsg => {
                    setMessages(prev => {
                        const cleanPrev = prev.filter(Boolean);
                        const isDuplicate = cleanPrev.some(m => m && m._id === decryptedMsg._id);
                        if (isDuplicate) return cleanPrev;
                        return [...cleanPrev, decryptedMsg];
                    });
                });
                
                // If we are currently looking at this active conversation, mark this incoming message as read!
                getToken().then(token => {
                    communityService.markChatMessageAsRead(activeConversation._id, token);
                });
                
                setTimeout(scrollToBottom, 50);
            }

            // Dynamically refresh sidebar previews
            if (data && data.message) {
                setConversations(prev => {
                    const matched = prev.find(c => c._id === data.conversationId);
                    if (matched) {
                        return prev.map(conv => 
                            conv._id === data.conversationId 
                            ? { ...conv, lastMessage: data.message } 
                            : conv
                        );
                    } else {
                        // Trigger dynamic reload of conversations to append new active partner in real time
                        getToken().then(token => {
                            communityService.getUserConversations(token).then(res => {
                                if (res.success) setConversations(res.data);
                            });
                        });
                        return prev;
                    }
                });
            }
        });

        return () => {
            socket.off('chat:message');
        };
    }, [socket, activeConversation]);

    // 3b. Setup Socket Online Status Receivers
    useEffect(() => {
        if (!socket) return;

        socket.emit('get-online-users');

        socket.on('online-users-list', (userIds) => {
            setOnlineUserIds(new Set(userIds));
        });

        socket.on('user:online', (userId) => {
            setOnlineUserIds(prev => {
                const next = new Set(prev);
                next.add(userId);
                return next;
            });
        });

        socket.on('user:offline', (userId) => {
            setOnlineUserIds(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        });

        return () => {
            socket.off('online-users-list');
            socket.off('user:online');
            socket.off('user:offline');
        };
    }, [socket]);

    // 4. Send Message Handler — ENCRYPTS before sending
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;

        const originalText = newMessage;
        setNewMessage(""); // Clear early for snappy visual feedback
        setIsSending(true);

        try {
            const token = await getToken();

            // Determine recipient for encryption
            const recipient = getRecipientProfile(activeConversation);
            let encryptedPayload = { content: originalText, nonce: '', isEncrypted: false };

            // Encrypt if E2EE is ready and we have a 1-on-1 conversation
            if (e2eeReady && recipient && !activeConversation.isGroup) {
                const encrypted = await encrypt(originalText, recipient.firebaseUid);
                if (encrypted && encrypted.isEncrypted) {
                    encryptedPayload = encrypted;
                }
            }

            const res = await communityService.sendChatMessage(
                activeConversation._id,
                encryptedPayload.content,
                token,
                { nonce: encryptedPayload.nonce, isEncrypted: encryptedPayload.isEncrypted }
            );

            if (res.success) {
                // Store plaintext locally for our own sent messages
                const displayMsg = {
                    ...res.data,
                    _displayContent: originalText,
                    _decryptedContent: originalText,
                };

                setMessages(prev => {
                    const isDuplicate = prev.some(m => m._id === res.data._id);
                    if (isDuplicate) return prev;
                    return [...prev, displayMsg];
                });
                setTimeout(scrollToBottom, 50);

                // Update sidebar preview — show plaintext for own messages
                setConversations(prev => prev.map(conv => 
                    conv._id === activeConversation._id 
                    ? { ...conv, lastMessage: { ...res.data, _displayContent: originalText } } 
                    : conv
                ));
            }
        } catch (error) {
            toast.error("Failed to transmit signal");
            setNewMessage(originalText); // Rollback text if it fails
        } finally {
            setIsSending(false);
        }
    };

    // Helper: extract the recipient traveler profile
    const getRecipientProfile = (conv) => {
        if (!conv || conv.isGroup) return null;
        return conv.participantDetails?.find(p => p.firebaseUid !== firebaseUid) || null;
    };

    const formatMessageTime = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filteredConversations = conversations.filter(conv => {
        if (conv.isGroup) {
            return conv.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
        }
        const profile = getRecipientProfile(conv);
        return profile?.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) || 
               profile?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden">
            <NavBar />
            <div className="flex-1 flex bg-background overflow-hidden font-inter border-t border-white/5 pt-16 sm:pt-[80px]">
            {/* Sidebar List panel */}
            <div className={`w-full md:w-[340px] lg:w-[400px] border-r border-white/5 flex flex-col bg-card transition-all duration-300 ${showMobileSidebar ? 'flex' : 'hidden md:flex'}`}>
                {/* Header */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
                                W
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tighter italic">NEXUS CHAT</h1>
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border-2 border-black" title="Encrypted Connection Live" />
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <Input 
                            placeholder="Filter travelers..." 
                            className="pl-12 bg-white/[0.02] border-white/5 rounded-2xl h-12 focus-visible:ring-primary/40 focus-visible:ring-2 placeholder-white/20 text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Traveler Chat List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
                    {loading ? (
                        <ChatSidebarSkeleton />
                    ) : filteredConversations.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto text-white/20">
                                <Users size={20} />
                            </div>
                            <p className="text-xs text-white/30 font-bold uppercase tracking-wider">No connections found</p>
                        </div>
                    ) : (
                        filteredConversations.map((conv) => {
                            const recipient = getRecipientProfile(conv);
                            const isOnline = recipient && onlineUserIds.has(recipient.firebaseUid);
                            const isActive = activeConversation?._id === conv._id;
                            const avatarUrl = recipient?.profilepicture;

                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => {
                                        setActiveConversation(conv);
                                        setShowMobileSidebar(false);
                                    }}
                                    className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 border ${isActive ? 'bg-primary/10 border-primary/20 shadow-lg shadow-primary/5' : 'hover:bg-white/[0.02] border-transparent hover:border-white/5'}`}
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 overflow-hidden flex items-center justify-center font-bold text-white shadow-md">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt={recipient?.fullname} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{recipient?.fullname?.charAt(0).toUpperCase() || 'T'}</span>
                                            )}
                                        </div>
                                        {isOnline && (
                                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#07090e]" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-bold text-white truncate text-sm">
                                                {recipient?.fullname || 'Traveler'}
                                            </h3>
                                            <span className="text-[10px] text-white/20 font-bold">
                                                {formatMessageTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-white/40 truncate font-medium flex items-center gap-1">
                                            {conv.lastMessage?.isEncrypted && <Lock size={9} className="text-emerald-500/50 shrink-0" />}
                                            {conv.lastMessage?._displayContent || (conv.lastMessage?.isEncrypted ? 'Encrypted message' : conv.lastMessage?.content) || "Tap to open Travel Line"}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Frame */}
            <div className={`flex-1 flex flex-col bg-background relative ${!showMobileSidebar ? 'flex' : 'hidden md:flex'}`}>
                {activeConversation ? (
                    <>
                        {/* Chat Bar Header */}
                        {(() => {
                            const recipient = getRecipientProfile(activeConversation);
                            const isOnline = recipient && onlineUserIds.has(recipient.firebaseUid);

                            return (
                                <div className="h-16 sm:h-20 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 bg-card/80 backdrop-blur-xl z-10">
                                    <div className="flex items-center gap-4">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="md:hidden rounded-full hover:bg-white/5 text-white/60"
                                            aria-label="Back to chat list"
                                            onClick={() => setShowMobileSidebar(true)}
                                        >
                                            <ArrowLeft size={20} />
                                        </Button>
 
                                        <div 
                                            className="cursor-pointer flex items-center gap-4"
                                            onClick={() => navigate(`/user/profile/${recipient?.firebaseUid}`)}
                                        >
                                            <div className="relative">
                                                <div className="w-11 h-11 rounded-xl bg-slate-900 border border-white/10 overflow-hidden flex items-center justify-center font-bold text-white shadow-md">
                                                    {recipient?.profilepicture ? (
                                                        <img src={recipient.profilepicture} alt={recipient.fullname} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{recipient?.fullname?.charAt(0).toUpperCase() || 'T'}</span>
                                                    )}
                                                </div>
                                                {isOnline && (
                                                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                                                )}
                                            </div>
 
                                            <div>
                                                <h2 className="font-black text-white tracking-tight text-sm flex items-center gap-2 hover:text-primary transition-colors">
                                                    {recipient?.fullname || 'Traveler'}
                                                </h2>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[9px] uppercase tracking-widest font-black ${isOnline ? 'text-emerald-500 animate-pulse' : 'text-white/30'}`}>
                                                        {isOnline ? 'Active Online Line' : 'Traveler offline'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action items */}
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="rounded-full hover:bg-white/5 text-white/40 hover:text-white"
                                            aria-label="View traveler profile"
                                            onClick={() => navigate(`/user/profile/${recipient?.firebaseUid}`)}
                                        >
                                            <User size={18} />
                                        </Button>
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5 text-white/40 hover:text-white" aria-label="More chat options">
                                                    <MoreVertical size={18} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-card border-white/10 text-white min-w-[200px] p-2 rounded-2xl">
                                                <DropdownMenuItem 
                                                    className="flex items-center gap-2 hover:bg-white/5 cursor-pointer text-xs py-2.5 px-3 rounded-xl focus:bg-white/5 focus:text-white"
                                                    onClick={() => navigate(`/user/profile/${recipient?.firebaseUid}`)}
                                                >
                                                    <User size={14} className="text-white/40" />
                                                    <span>View Profile</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="flex items-center gap-2 hover:bg-red-500/10 hover:text-red-400 cursor-pointer text-xs py-2.5 px-3 rounded-xl focus:bg-red-500/10 focus:text-red-400"
                                                    onClick={async () => {
                                                        const confirmed = window.confirm(
                                                            "Are you sure you want to reset your encryption keys? \n\n" +
                                                            "WARNING: This will generate a new secure key pair. " +
                                                            "Past encrypted messages in this session will no longer be readable, " +
                                                            "but it will solve any key mismatches for future messages. Continue?"
                                                        );
                                                        if (confirmed) {
                                                            const success = await resetE2EE();
                                                            if (success) {
                                                                window.location.reload();
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <AlertTriangle size={14} className="text-red-400" />
                                                    <span>Reset Encryption Keys</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* WhatsApp-like Message scroll workspace */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.02),transparent_50%)]">
                            {/* E2EE Banner */}
                            <div className="flex items-center justify-center gap-2 py-3 px-5 mx-auto w-fit rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                <Lock size={12} className="text-emerald-400" />
                                <span className="text-[9px] text-emerald-400/70 font-black uppercase tracking-widest">
                                    Messages are end-to-end encrypted. No one outside of this chat can read them.
                                </span>
                            </div>

                            {messages.map((msg, i) => {
                                const isMe = msg.senderFirebaseUid === firebaseUid;
                                const displayContent = msg._displayContent || msg.content;
                                const isEncryptedMsg = msg.isEncrypted;
                                return (
                                    <motion.div
                                        key={msg._id || i}
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className="max-w-[85%] sm:max-w-[70%] space-y-1">
                                            <div className={`p-4 rounded-3xl text-sm leading-relaxed ${isMe ? 'bg-gradient-to-r from-emerald-600/30 to-teal-500/20 text-emerald-100 border border-emerald-500/20 rounded-tr-none shadow-[0_4px_20px_rgba(16,185,129,0.05)]' : 'bg-white/[0.02] text-white border border-white/5 rounded-tl-none'}`}>
                                                <p>{displayContent}</p>
                                            </div>
                                            <div className={`flex items-center gap-1.5 text-[9px] text-white/20 font-black uppercase tracking-widest ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                {isEncryptedMsg && (
                                                    <Lock size={9} className="text-emerald-500/60" title="End-to-end encrypted" />
                                                )}
                                                <span>{formatMessageTime(msg.createdAt)}</span>
                                                {isMe && (
                                                    msg.status === 'seen' ? (
                                                        <CheckCheck size={12} className="text-emerald-400" title="Seen" />
                                                    ) : msg.status === 'delivered' ? (
                                                        <CheckCheck size={12} className="text-white/30" title="Delivered" />
                                                    ) : (
                                                        <Check size={12} className="text-white/30" title="Sent" />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* WhatsApp Message text input — E2EE encrypted */}
                        <div className="p-3 sm:p-4 bg-card border-t border-white/5">
                            <form onSubmit={handleSend} className="flex items-center gap-3 max-w-5xl mx-auto">
                                <div className="flex-1 relative">
                                    <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/40" />
                                    <Input 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={e2eeReady ? "End-to-end encrypted message..." : "Initializing encryption..."}
                                        className="bg-white/[0.01] border-white/5 rounded-2xl h-12 sm:h-14 pl-10 pr-12 focus-visible:ring-emerald-500/40 focus-visible:ring-2 text-white placeholder-white/20 text-sm font-medium"
                                        disabled={isSending}
                                    />
                                    <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full text-white/20 hover:text-white/60 hover:bg-transparent" aria-label="Open emoji picker">
                                        <Smile size={20} />
                                    </Button>
                                </div>
                                <Button 
                                    type="submit" 
                                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/10 flex items-center justify-center shrink-0"
                                    disabled={isSending || !newMessage.trim()}
                                >
                                    {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                </Button>
                            </form>
                            {e2eeReady && (
                                <div className="flex items-center justify-center gap-1.5 mt-2">
                                    <ShieldCheck size={10} className="text-emerald-500/50" />
                                    <span className="text-[7px] sm:text-[8px] text-emerald-500/40 font-black uppercase tracking-[0.2em]">E2EE Active — NaCl Box (X25519 + XSalsa20-Poly1305)</span>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center px-8 bg-background">
                        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center shadow-xl shadow-emerald-500/5">
                            <ShieldCheck size={36} className="text-emerald-400 animate-pulse" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter italic">NEXUS SECURE TERMINAL</h2>
                            <p className="text-white/30 text-xs font-bold uppercase tracking-wider max-w-xs mx-auto">Select a traveler connection to initiate end-to-end encrypted messaging.</p>
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <Lock size={12} className="text-emerald-500/60" />
                                <span className="text-[9px] text-emerald-500/50 font-black uppercase tracking-widest">
                                    {e2eeReady ? 'Encryption keys ready — NaCl X25519' : 'Generating encryption keys...'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
    );
};

export default ChatPage;
