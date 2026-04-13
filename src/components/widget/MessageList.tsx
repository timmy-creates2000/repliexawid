import React, { useRef, useEffect } from 'react';
import { Bot } from 'lucide-react';
import MessageBubble from './MessageBubble';
import type { ChatMessage } from '../../lib/types';

interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  brandColor: string;
  businessName: string;
  customerName: string;
}

export default function MessageList({
  messages,
  isTyping,
  brandColor,
  businessName,
  customerName,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
      {messages.map((m, i) => (
        <MessageBubble
          key={i}
          message={m}
          senderName={m.role === 'user' ? (customerName || 'You') : businessName}
          brandColor={brandColor}
        />
      ))}

      {isTyping && (
        <div className="flex gap-3">
          <div
            style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
          >
            <Bot className="w-4 h-4" />
          </div>
          <div className="p-4 bg-white/10 rounded-2xl rounded-tl-none flex gap-1 items-center">
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        </div>
      )}
    </div>
  );
}
