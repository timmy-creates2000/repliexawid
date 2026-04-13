import React from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface InputBarProps {
  input: string;
  onInputChange: (v: string) => void;
  onSend: (text?: string) => void;
  isListening: boolean;
  onToggleVoice: () => void;
  brandColor: string;
}

const QUICK_COMMANDS = [
  { label: 'Products', msg: 'What products do you have?' },
  { label: 'Pricing', msg: 'What are your prices?' },
  { label: 'Negotiate', msg: 'Can we negotiate the price?' },
  { label: 'Support', msg: 'I need help with something.' },
];

export default function InputBar({
  input,
  onInputChange,
  onSend,
  isListening,
  onToggleVoice,
  brandColor,
}: InputBarProps) {
  return (
    <div className="p-4 bg-black/40 border-t border-cyan-500/10 flex-shrink-0">
      <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide">
        <span className="text-[8px] text-cyan-500/40 uppercase font-bold tracking-widest flex-shrink-0">Quick:</span>
        {QUICK_COMMANDS.map(cmd => (
          <button
            key={cmd.label}
            onClick={() => onSend(cmd.msg)}
            className="px-2 py-1 bg-cyan-500/5 border border-cyan-500/10 rounded text-[8px] text-cyan-500/60 hover:text-cyan-400 hover:border-cyan-500/30 transition-all uppercase tracking-widest flex-shrink-0"
          >
            {cmd.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <input
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSend()}
          placeholder="Ask about products, pricing, or negotiate..."
          className="w-full bg-black/60 border border-cyan-500/20 rounded-2xl py-4 pl-6 pr-24 text-xs outline-none transition-all focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] placeholder:text-white/20"
        />
        <div className="absolute right-2 top-2 flex gap-1">
          <button
            onClick={onToggleVoice}
            className={cn(
              'p-2 rounded-xl transition-all',
              isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-white/5 text-white/40 hover:text-white'
            )}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            onClick={() => onSend()}
            style={{ backgroundColor: brandColor }}
            className="p-2 text-white rounded-xl hover:opacity-90 transition-all shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
