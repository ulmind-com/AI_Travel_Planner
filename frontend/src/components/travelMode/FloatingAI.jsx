import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Bot, Send, Sparkles, X, Mic, RefreshCw, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FloatingAI({ currentLocation, onCommandExecuted }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: `Hello! I'm your Nexus Copilot. I have access to your live location and nearby real-time travel intelligence. Ask me anything about ${currentLocation || 'your destination'}!`,
      time: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const { getToken } = useAuth();

  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

  // Quick suggestion chips based on real-time travel parameters
  const quickSuggestions = [
    `How is the crowd level in ${currentLocation || 'this area'}?`,
    `Is there any safety warning today?`,
    `What are the best outdoor spots nearby?`,
    `Give me a quick 3-hour walking route.`
  ];

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || message;
    if (!query.trim()) return;

    // Add user message to history
    const userMessage = {
      sender: 'user',
      text: query,
      time: new Date()
    };
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    try {
      const token = await getToken();
      
      // We construct a localized context prompt prepending location details to help the backend model
      const contextualMessage = `[Current Destination: ${currentLocation || 'Unknown'}]. User asks: ${query}`;

      const response = await axios.post(
        `${VITE_BACKEND_URL}/api/v1/ai/chat`,
        { message: contextualMessage },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      let aiResponseText = '';
      if (response.data && response.data.response) {
        aiResponseText = response.data.response;
      } else if (response.data && response.data.reply) {
        aiResponseText = response.data.reply;
      } else if (response.data && response.data.text) {
        aiResponseText = response.data.text;
      } else if (typeof response.data === 'string') {
        aiResponseText = response.data;
      } else {
        aiResponseText = "I parsed your location but couldn't contact the intelligence engine. Everything looks optimal here!";
      }

      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiResponseText,
          time: new Date()
        }
      ]);

      // Callback to parent if user triggers travel mode changes (e.g. route, controls)
      if (onCommandExecuted) {
        onCommandExecuted(query, aiResponseText);
      }

    } catch (error) {
      console.error("AI response failed:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: "I encountered an error querying the intelligence engine. Please check your network and try again shortly.",
          time: new Date()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  return (
    <>
      {/* Floating Draggable Button */}
      <div className="fixed right-6 bottom-32 z-50 pointer-events-auto">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-purple-600 text-white shadow-[0_0_25px_rgba(168,85,247,0.5)] border border-purple-400/30 hover:scale-110 active:scale-95 transition-all duration-300 group cursor-pointer"
        >
          {/* Glowing Ring */}
          <div className="absolute inset-0 rounded-full border border-purple-500 animate-pulse scale-110 opacity-70 group-hover:scale-125 transition-all" />
          <div className="absolute inset-0 rounded-full bg-purple-500/10 animate-ping opacity-40" />

          {isOpen ? <X size={22} className="rotate-90 transition-transform duration-300" /> : <Bot size={24} className="group-hover:rotate-12 transition-transform" />}
        </button>
      </div>

      {/* Floating Chat Drawer/Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-y-0 right-0 z-40 w-full md:w-[420px] p-4 flex flex-col justify-end pointer-events-none">
            {/* Backdrop for mobile */}
            <div 
              className="fixed inset-0 md:hidden bg-black/60 backdrop-blur-sm pointer-events-auto"
              onClick={() => setIsOpen(false)}
            />

            <div className="relative w-full h-[85vh] md:h-[600px] flex flex-col bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl pointer-events-auto overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Sparkles size={16} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                      Nexus Copilot
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </h3>
                    <p className="text-[10px] text-white/40">Live Travel Advisor</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-primary text-black rounded-tr-sm font-semibold'
                          : 'bg-white/5 text-white border border-white/10 rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                      <span className="block text-[8px] opacity-40 mt-1 text-right">
                        {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl rounded-tl-sm flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick suggestion chips */}
              {chatHistory.length === 1 && (
                <div className="px-4 py-2 space-y-1.5 border-t border-white/5 bg-white/[0.02]">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-white/30">Suggestions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-[10px] text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-2.5 py-1.5 rounded-lg text-left transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Input */}
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="p-3 border-t border-white/10 bg-black/60 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about route, traffic, spots..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
                
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="p-2.5 rounded-xl bg-white text-black hover:bg-white/95 disabled:opacity-30 disabled:hover:bg-white transition-all flex items-center justify-center cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
