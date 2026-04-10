import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, MicOff, X, Bot, User, DollarSign, Package, ChevronDown, MessageSquare, Zap } from 'lucide-react';
import { getAgentResponse, BusinessConfig } from '../lib/gemini';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  parts: string;
  timestamp: Date;
}

export default function ChatWidget({ config, fullPage = false }: { config: BusinessConfig, fullPage?: boolean }) {
  const [isOpen, setIsOpen] = useState(fullPage);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', parts: `Hello! I'm your AI assistant for ${config.name}. How can I help you today?`, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = { role: 'user', parts: messageText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Detect lead info (simple email extraction)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = messageText.match(emailRegex);
    if (emails && emails.length > 0) {
      fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: config.userId,
          name: 'Anonymous User',
          email: emails[0],
          phone: ''
        })
      }).catch(err => console.error("Lead save error:", err));
    }

    const response = await getAgentResponse(messageText, messages, config);
    
    const aiMessage: Message = { role: 'model', parts: response || "I'm sorry, I couldn't process that.", timestamp: new Date() };
    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
    } else {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSend(transcript);
      };

      recognition.start();
    }
  };

  const widgetClasses = fullPage 
    ? "w-full h-screen bg-[#0a0a0a]/80 flex flex-col overflow-hidden font-mono relative"
    : cn(
        "fixed bottom-6 w-[400px] h-[600px] bg-[#0a0a0a]/90 backdrop-blur-2xl border border-cyan-500/20 rounded-3xl shadow-[0_0_30px_rgba(6,182,212,0.1)] flex flex-col overflow-hidden z-50 font-mono transition-all duration-300",
        config.widgetPosition === 'bottom-left' ? "left-6" : "right-6",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      );

  return (
    <>
      {!fullPage && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{ backgroundColor: config.brandColor, boxShadow: `0 0 20px ${config.brandColor}40` }}
          className={cn(
            "fixed bottom-6 w-14 h-14 rounded-full flex items-center justify-center z-50 transition-all hover:scale-110 active:scale-95 border border-white/20",
            config.widgetPosition === 'bottom-left' ? "left-6" : "right-6"
          )}
        >
          {isOpen ? <X className="w-6 h-6 text-white" /> : <Zap className="w-6 h-6 text-white animate-pulse" />}
        </button>
      )}

      <div className={widgetClasses}>
        {/* Header */}
        <div className="p-6 bg-cyan-500/5 border-b border-cyan-500/10 flex items-center justify-between relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          <div className="flex items-center gap-3">
            <div 
              style={{ backgroundColor: config.brandColor, boxShadow: `0 0 15px ${config.brandColor}80` }}
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20"
            >
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-white text-xs uppercase tracking-tighter scifi-glow-text">{config.name} CORE</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,211,238,1)]" />
                <span className="text-[8px] text-cyan-400/60 uppercase tracking-[0.2em] font-bold">Neural Link Active</span>
              </div>
            </div>
          </div>
          {!fullPage && (
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronDown className="w-5 h-5 text-white/40" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3 max-w-[85%]",
                m.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                m.role === 'user' ? "bg-white/10" : ""
              )}
              style={m.role === 'model' ? { backgroundColor: `${config.brandColor}20`, color: config.brandColor } : {}}
              >
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-xs leading-relaxed border",
                m.role === 'user' 
                  ? "bg-white/5 text-white border-white/10 rounded-tr-none" 
                  : "bg-cyan-500/5 text-cyan-50 border-cyan-500/20 rounded-tl-none shadow-[0_0_15px_rgba(6,182,212,0.05)]"
              )}>
                <div className="flex items-center gap-2 mb-1 opacity-40 text-[8px] uppercase tracking-widest">
                  <span>{m.role === 'user' ? 'User' : 'Repliexa'}</span>
                  <span>//</span>
                  <span>{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {m.parts}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div 
                style={{ backgroundColor: `${config.brandColor}20`, color: config.brandColor }}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
              >
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 bg-white/10 rounded-2xl rounded-tl-none flex gap-1">
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-black/40 border-t border-cyan-500/10">
          <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
            <span className="text-[8px] text-cyan-500/40 uppercase font-bold tracking-widest flex-shrink-0">Commands:</span>
            {['Pricing', 'Negotiate', 'Specs', 'Support'].map(cmd => (
              <button key={cmd} className="px-2 py-1 bg-cyan-500/5 border border-cyan-500/10 rounded text-[8px] text-cyan-500/60 hover:text-cyan-400 hover:border-cyan-500/30 transition-all uppercase tracking-widest">
                {cmd}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Enter query protocol..."
              className="w-full bg-black/60 border border-cyan-500/20 rounded-2xl py-4 pl-6 pr-24 text-xs outline-none transition-all focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] placeholder:text-white/20"
            />
            <div className="absolute right-2 top-2 flex gap-1">
              <button 
                onClick={toggleVoice}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  isListening ? "bg-red-500 text-white animate-pulse" : "hover:bg-white/5 text-white/40 hover:text-white"
                )}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => handleSend()}
                style={{ backgroundColor: config.brandColor }}
                className="p-2 text-white rounded-xl hover:opacity-90 transition-all shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
