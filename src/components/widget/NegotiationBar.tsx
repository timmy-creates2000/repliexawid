import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { NegotiationState } from '../../lib/types';

interface NegotiationBarProps {
  negotiation: NegotiationState;
  onReset: () => void;
}

export default function NegotiationBar({ negotiation, onReset }: NegotiationBarProps) {
  return (
    <AnimatePresence>
      {negotiation.status === 'negotiating' && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between overflow-hidden flex-shrink-0"
        >
          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">
            Negotiating · Offer: ₦{negotiation.currentOffer.toLocaleString()} · Floor: ₦{negotiation.minPrice.toLocaleString()}
          </span>
          <button
            onClick={onReset}
            className="text-[9px] text-white/20 hover:text-white uppercase tracking-widest"
          >
            Reset
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
