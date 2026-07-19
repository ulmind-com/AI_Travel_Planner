import { useState, useRef, useEffect } from 'react';
import { 
    Bot, Send, X, Sparkles, Trash2, Calendar, MapPin, 
    DollarSign, Hotel, RefreshCw, Plus, Check, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChatAssistant } from '@/context/ChatContext';
import { useAuth, useUser } from '@/context/AuthContext';
import { useSocket } from '@/context/appContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_BACKEND_URL || '';

const ChatAssistant = () => {
    const { isChatOpen, closeChat, toggleChat } = useChatAssistant();
    const { user } = useUser();
    const { getToken } = useAuth();
    const { socket } = useSocket();

    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSavingPlanId, setIsSavingPlanId] = useState(null);
    const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const scrollRef = useRef(null);
    const buttonRef = useRef(null);

    // Load message history from DB
    const loadChatHistory = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const res = await axios.get(`${API_URL}/api/v1/ai/chat/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data?.success && res.data?.data) {
                const formatted = res.data.data.map((msg, index) => ({
                    id: msg._id || index,
                    type: msg.role === 'user' ? 'user' : 'ai',
                    text: msg.content,
                    timestamp: new Date(msg.timestamp),
                    action: msg.action,
                    intent: msg.intent
                }));
                setMessages(formatted);
            }
        } catch (error) {
            console.error('Failed to load AI chat history:', error);
        }
    };

    // Socket listeners for real-time chat
    useEffect(() => {
        if (!socket) return;

        const handleChatReceive = (response) => {
            setIsTyping(false);
            if (response && response.aiResponse) {
                const newMsg = {
                    id: Date.now(),
                    type: 'ai',
                    text: response.aiResponse.message,
                    timestamp: new Date(),
                    action: response.action || {
                        aiResponse: response.aiResponse,
                        followUps: response.followUps
                    },
                    intent: response.intent
                };
                setMessages((prev) => [...prev, newMsg]);
            }
        };

        const handleChatError = (err) => {
            setIsTyping(false);
            toast.error(err.message || 'Error communicating with assistant.');
        };

        socket.on('chat:receive', handleChatReceive);
        socket.on('chat:error', handleChatError);

        return () => {
            socket.off('chat:receive', handleChatReceive);
            socket.off('chat:error', handleChatError);
        };
    }, [socket]);

    // Load history when chat is opened
    useEffect(() => {
        if (isChatOpen) {
            loadChatHistory();
        }
    }, [isChatOpen]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Drag handlers for floating trigger button
    const handleMouseDown = (e) => {
        if (isChatOpen) return;
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        const maxX = window.innerWidth - 64;
        const maxY = window.innerHeight - 64;
        setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY)),
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragOffset]);

    // Send Message
    const handleSendMessage = async (textToSend = null) => {
        const text = textToSend || inputMessage;
        if (!text.trim()) return;

        const userMsg = {
            id: Date.now() + Math.random(),
            type: 'user',
            text: text,
            timestamp: new Date()
        };

        setMessages((prev) => [...prev, userMsg]);
        if (!textToSend) setInputMessage('');
        setIsTyping(true);

        // Check if Socket connection exists and is active
        if (socket && socket.connected) {
            socket.emit('identity', user?.firebaseUid || user?.id);
            socket.emit('chat:send', { message: text });
        } else {
            // REST Fallback if sockets are disconnected
            try {
                const token = await getToken();
                const res = await axios.post(`${API_URL}/api/v1/ai/chat`, {
                    message: text
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data) {
                    const aiMsg = {
                        id: Date.now() + 1,
                        type: 'ai',
                        text: res.data.aiResponse?.message || JSON.stringify(res.data),
                        timestamp: new Date(),
                        action: res.data.action || {
                            aiResponse: res.data.aiResponse,
                            followUps: res.data.followUps
                        },
                        intent: res.data.intent
                    };
                    setMessages((prev) => [...prev, aiMsg]);
                }
            } catch (err) {
                console.error('REST AI chat error:', err);
                toast.error('Could not connect to AI Copilot. Please try again.');
            } finally {
                setIsTyping(false);
            }
        }
    };

    // Save plan from chat to DB
    const handleCreatePlan = async (destination, budget, days, itinerary, hotels, msgId) => {
        setIsSavingPlanId(msgId);
        try {
            const token = await getToken();
            const res = await axios.post(`${API_URL}/api/v1/ai/convert-plan`, {
                to: destination,
                budget: budget ? parseInt(budget.replace(/[^0-9]/g, '')) || 50000 : 50000,
                days: days || itinerary?.length || 3,
                itinerary: itinerary,
                hotels: hotels
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data?.success) {
                toast.success('Itinerary saved to your travel plans! ✈️');
            } else {
                toast.error('Failed to convert plan. Please try again.');
            }
        } catch (error) {
            console.error('Convert plan failed:', error);
            toast.error('Error saving plan to profile.');
        } finally {
            setIsSavingPlanId(null);
        }
    };

    // Clear Chat history
    const handleClearHistory = async () => {
        if (!window.confirm('Wipe chat history? This will clear assistant memory.')) return;
        try {
            const token = await getToken();
            await axios.delete(`${API_URL}/api/v1/ai/chat/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages([]);
            toast.success('Chat memory cleared.');
        } catch (error) {
            toast.error('Failed to clear chat memory.');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            <button
                ref={buttonRef}
                onClick={() => !isDragging && toggleChat()}
                onMouseDown={handleMouseDown}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
                className={`fixed z-50 w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-500 shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 flex items-center justify-center group ${isChatOpen ? 'scale-0' : 'scale-100 hover:scale-110'
                    } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                aria-label="Open AI travel assistant"
            >
                <Bot className="w-8 h-8 text-white animate-pulse" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </button>

            {/* Premium Chat Panel Container */}
            {isChatOpen && (
                <div
                    style={{
                        left: position.x > window.innerWidth / 2 ? 'auto' : `${position.x}px`,
                        right: position.x > window.innerWidth / 2 ? `${window.innerWidth - position.x - 64}px` : 'auto',
                        bottom: position.y > window.innerHeight / 2 ? `${window.innerHeight - position.y}px` : 'auto',
                        top: position.y > window.innerHeight / 2 ? 'auto' : `${position.y + 80}px`,
                    }}
                    className="fixed z-50 sm:w-[440px] w-[95vw] h-[650px] max-h-[85vh] bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-6 duration-300"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-4 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold font-outfit text-sm sm:text-base flex items-center gap-1.5">
                                    AI Travel Copilot <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                                </h3>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                                    <span className="text-white/80 text-xs">Real-Time Core Active</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {messages.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleClearHistory}
                                    className="text-white hover:bg-white/15 rounded-full"
                                    title="Wipe conversation memory"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={closeChat}
                                className="text-white hover:bg-white/15 rounded-full"
                            >
                                <X size={18} />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-950/20" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-500 shadow-inner">
                                    <Sparkles className="w-8 h-8" />
                                </div>
                                <h4 className="text-white font-bold font-outfit text-lg">Your Travel Twin Copilot</h4>
                                <p className="text-zinc-400 text-xs max-w-xs">
                                    Start chatting to plan tailored itineraries, fetch custom hotel selections, and save plans directly into your profile.
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center pt-2">
                                    {['Plan trip to Japan 🌸', 'Suggest cheap mountain treks ⛰️', '3-day family tour 👨‍👩‍👧'].map((starter) => (
                                        <button
                                            key={starter}
                                            onClick={() => handleSendMessage(starter)}
                                            className="text-xs px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
                                        >
                                            {starter}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((message) => {
                            const aiResponseData = message.action?.aiResponse;
                            const hasItineraryOrHotels = aiResponseData && (
                                (aiResponseData.itinerary && aiResponseData.itinerary.length > 0) ||
                                (aiResponseData.hotels && aiResponseData.hotels.length > 0)
                            );

                            return (
                                <div key={message.id} className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'} space-y-1`}>
                                    <div className={`flex items-start gap-2 max-w-[90%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                            message.type === 'user' 
                                                ? 'bg-zinc-800 text-white border border-zinc-700' 
                                                : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white border border-violet-500'
                                        }`}>
                                            {message.type === 'user' ? (user?.fullname?.charAt(0) || user?.fullName?.charAt(0) || 'U') : <Bot size={16} />}
                                        </div>

                                        {/* Message Capsule */}
                                        <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                                            message.type === 'user'
                                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                                : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none'
                                        }`}>
                                            <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                                        </div>
                                    </div>

                                    {/* Structured Interactive AI Response Cards */}
                                    {message.type === 'ai' && hasItineraryOrHotels && (
                                        <div className="ml-10 w-[90%] mt-2">
                                            <AIResponseCard 
                                                aiResponse={aiResponseData}
                                                onSave={(dest, budget, days, itin, hotels) => 
                                                    handleCreatePlan(dest, budget, days, itin, hotels, message.id)
                                                }
                                                isSaving={isSavingPlanId === message.id}
                                                onOptimize={(constraint) => handleSendMessage(`Optimize the plan to ${aiResponseData.destinations?.[0] || 'destination'}: ${constraint}`)}
                                            />
                                        </div>
                                    )}

                                    {/* Follow Up Suggestion chips */}
                                    {message.type === 'ai' && message.action?.followUps && message.id === messages[messages.length - 1]?.id && (
                                        <div className="ml-10 flex flex-wrap gap-1.5 pt-2">
                                            {message.action.followUps.map((chip, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSendMessage(chip)}
                                                    className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-indigo-400 hover:bg-zinc-800 hover:text-white transition-all flex items-center gap-1"
                                                >
                                                    <Sparkles size={10} />
                                                    {chip}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {isTyping && (
                            <div className="flex items-start gap-2 max-w-[80%]">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 border border-violet-500">
                                    <Bot size={16} className="text-white animate-pulse" />
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-none px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></div>
                                            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                        </div>
                                        <span className="text-[11px] text-zinc-400">AI is mapping routes...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Inputs Section */}
                    <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                        <div className="flex gap-2">
                            <Input
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Where to next? (e.g. 5 days in Paris)"
                                className="flex-1 rounded-xl bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                            <Button
                                onClick={() => handleSendMessage()}
                                disabled={!inputMessage.trim() || isTyping}
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl px-4"
                            >
                                <Send size={16} />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

/**
 * Inner component rendering the gorgeous bento/tabbed itinerary card.
 */
const AIResponseCard = ({ aiResponse, onSave, isSaving, onOptimize }) => {
    const [activeTab, setActiveTab] = useState('itinerary');
    const [expandedDays, setExpandedDays] = useState({ 1: true });

    const toggleDay = (day) => {
        setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
    };

    const destination = aiResponse.destinations?.[0] || 'Trip';
    const estimatedCost = aiResponse.estimatedCost || 'N/A';
    const itinerary = aiResponse.itinerary || [];
    const hotels = aiResponse.hotels || [];
    const tips = aiResponse.tips || [];

    return (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl text-zinc-300">
            {/* Title / Cost Banner */}
            <div className="bg-zinc-900 border-b border-zinc-800 p-3 flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="font-bold text-white uppercase tracking-wider">{destination}</span>
                </div>
                <div className="flex items-center gap-1 text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-semibold">
                    <DollarSign className="w-3 h-3" />
                    <span>Est: {estimatedCost}</span>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-zinc-800 text-xs bg-zinc-950/40">
                <button
                    onClick={() => setActiveTab('itinerary')}
                    className={`flex-1 py-2 text-center font-semibold border-b-2 transition-all ${
                        activeTab === 'itinerary' 
                            ? 'text-indigo-400 border-indigo-500 bg-zinc-900/40' 
                            : 'text-zinc-500 border-transparent hover:text-zinc-300'
                    }`}
                >
                    <Calendar className="w-3.5 h-3.5 inline mr-1" /> Plan
                </button>
                {hotels.length > 0 && (
                    <button
                        onClick={() => setActiveTab('hotels')}
                        className={`flex-1 py-2 text-center font-semibold border-b-2 transition-all ${
                            activeTab === 'hotels' 
                                ? 'text-indigo-400 border-indigo-500 bg-zinc-900/40' 
                                : 'text-zinc-500 border-transparent hover:text-zinc-300'
                        }`}
                    >
                        <Hotel className="w-3.5 h-3.5 inline mr-1" /> Hotels
                    </button>
                )}
                {tips.length > 0 && (
                    <button
                        onClick={() => setActiveTab('tips')}
                        className={`flex-1 py-2 text-center font-semibold border-b-2 transition-all ${
                            activeTab === 'tips' 
                                ? 'text-indigo-400 border-indigo-500 bg-zinc-900/40' 
                                : 'text-zinc-500 border-transparent hover:text-zinc-300'
                        }`}
                    >
                        <AlertCircle className="w-3.5 h-3.5 inline mr-1" /> Tips
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="p-3 max-h-[220px] overflow-y-auto text-xs space-y-3 bg-zinc-950/20">
                {activeTab === 'itinerary' && (
                    <div className="space-y-2.5">
                        {itinerary.map((item) => (
                            <div key={item.day} className="border border-zinc-800 bg-zinc-900/35 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => toggleDay(item.day)}
                                    className="w-full p-2.5 flex justify-between items-center hover:bg-zinc-800/40 transition-all font-semibold text-white"
                                >
                                    <span>Day {item.day}: {item.title}</span>
                                    {expandedDays[item.day] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                {expandedDays[item.day] && (
                                    <div className="px-2.5 pb-2.5 pt-0 text-[11px] text-zinc-400 border-t border-zinc-800/40 space-y-2">
                                        <p className="italic text-zinc-500">{item.description}</p>
                                        <div className="space-y-1 pl-1 border-l border-indigo-500/30">
                                            {item.activities?.map((act, index) => (
                                                <div key={index} className="flex items-center gap-1.5 text-zinc-300">
                                                    <div className="w-1 h-1 bg-indigo-400 rounded-full shrink-0"></div>
                                                    <span>{act}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'hotels' && (
                    <div className="space-y-2">
                        {hotels.map((hotel, index) => (
                            <div key={index} className="p-2 border border-zinc-800 bg-zinc-900/35 rounded-xl space-y-1">
                                <div className="flex justify-between items-center text-white font-semibold">
                                    <span>{hotel.name}</span>
                                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                        {hotel.cost}
                                    </span>
                                </div>
                                <p className="text-zinc-400 text-[11px] leading-relaxed">{hotel.description}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'tips' && (
                    <div className="space-y-2 pl-2">
                        {tips.map((tip, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                <span className="text-zinc-400 text-[11px]">{tip}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Actions Row */}
            <div className="border-t border-zinc-800 p-2.5 bg-zinc-900/50 flex gap-2">
                <Button
                    onClick={() => onSave(destination, estimatedCost, itinerary.length, itinerary, hotels)}
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs py-1.5 h-auto flex items-center justify-center gap-1.5 font-bold shadow-lg"
                >
                    {isSaving ? (
                        <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Plus className="w-3.5 h-3.5" />
                            Save to Plans
                        </>
                    )}
                </Button>

                {/* Quick Constraint Optimizer suggestions */}
                <div className="flex gap-1 shrink-0">
                    <button
                        onClick={() => onOptimize("Make it budget-friendly 💸")}
                        className="p-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[10px] text-zinc-400 hover:text-white"
                        title="Optimize for Budget"
                    >
                        💸
                    </button>
                    <button
                        onClick={() => onOptimize("Add more adventure activities ⛰️")}
                        className="p-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[10px] text-zinc-400 hover:text-white"
                        title="Optimize for Adventure"
                    >
                        ⛰️
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatAssistant;
