import React from 'react';
import { motion } from 'motion/react';
import { Bot, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ChatMessage } from '../../lib/types';

interface MessageBubbleProps {
  message: ChatMessage;
  senderName: string;
  brandColor: string;
}

export default function MessageBubble({ message, senderName, brandColor }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3 max-w-[85%]', isUser ? 'ml-auto flex-row-reverse' : '')}
    >
      <div
        className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', isUser ? 'bg-white/10' : '')}
        style={!isUser ? { backgroundColor: `${brandColor}20`, color: brandColor } : {}}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={cn(
        'p-4 rounded-2xl text-xs leading-relaxed border',
        isUser
          ? 'bg-white/5 text-white border-white/10 rounded-tr-none'
          : 'bg-cyan-500/5 text-cyan-50 border-cyan-500/20 rounded-tl-none shadow-[0_0_15px_rgba(6,182,212,0.05)]'
      )}>
        <div className="flex items-center gap-2 mb-1 opacity-40 text-[8px] uppercase tracking-widest">
          <span>{senderName}</span>
          <span>//</span>
          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {message.parts}
      </div>
    </motion.div>
  );
}
