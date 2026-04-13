import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  highlight?: boolean;
}

export default function SidebarItem({ icon, label, active, onClick, highlight }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden',
        active
          ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
          : highlight
          ? 'text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10 border border-amber-500/10'
          : 'text-white/40 hover:text-white hover:bg-white/5',
      )}
    >
      {active && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]" />
      )}
      <div
        className={cn(
          'transition-colors',
          active
            ? 'text-cyan-400'
            : highlight
            ? 'text-amber-400/70 group-hover:text-amber-400'
            : 'group-hover:text-cyan-400',
        )}
      >
        {icon}
      </div>
      <span className="uppercase tracking-widest text-[10px] font-bold">{label}</span>
      {highlight && !active && <Sparkles className="w-3 h-3 ml-auto text-amber-400/50" />}
    </button>
  );
}
