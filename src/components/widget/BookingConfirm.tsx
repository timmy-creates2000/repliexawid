import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Clock, Calendar, CreditCard, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import type { SessionType, TimeSlot } from '../../lib/types';

interface BookingConfirmProps {
  slot: TimeSlot;
  sessionType: SessionType;
  userId: string;
  brandColor: string;
  onConfirmed: (bookingId: string) => void;
  onBack: () => void;
}

export default function BookingConfirm({
  slot,
  sessionType,
  userId,
  brandColor,
  onConfirmed,
  onBack,
}: BookingConfirmProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startDate = new Date(slot.start);
  const endDate = new Date(slot.end);

  const handleConfirm = async () => {
    if (!email) { setError('Email is required'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await api.bookings.create({
        userId,
        sessionTypeId: sessionType.id,
        startTime: slot.start,
        visitorName: name || 'Anonymous',
        visitorEmail: email,
      });

      if (result.requiresPayment) {
        // Payment will be handled by ChatWidget's PaymentPrompt
        // For now, confirm the booking ID and let parent handle payment
        onConfirmed(result.bookingId);
      } else {
        onConfirmed(result.bookingId);
      }
    } catch (err: any) {
      if (err?.data?.error === 'slot_taken') {
        setError('This slot was just taken. Please go back and choose another time.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="mx-4 mb-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl space-y-3"
    >
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white transition-colors uppercase tracking-widest font-bold">
        <ChevronLeft className="w-3 h-3" /> Back
      </button>

      {/* Session details */}
      <div className="p-3 bg-black/30 rounded-xl space-y-2">
        <p className="text-xs font-bold text-white">{sessionType.name}</p>
        <div className="flex items-center gap-3 text-[10px] text-white/50 font-mono">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {startDate.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
            {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-[10px] font-bold" style={{ color: brandColor }}>
          {sessionType.isFree ? 'FREE' : `₦${sessionType.price.toLocaleString()}`}
        </p>
      </div>

      {/* Visitor details */}
      <div className="space-y-2">
        <input
          placeholder="Your name (optional)"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-3 text-xs outline-none focus:border-cyan-500 transition-all placeholder:text-white/20"
        />
        <input
          type="email"
          placeholder="Your email (required)"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-3 text-xs outline-none focus:border-cyan-500 transition-all placeholder:text-white/20"
        />
      </div>

      {error && <p className="text-[10px] text-red-400 font-mono">{error}</p>}

      <button
        onClick={handleConfirm}
        disabled={!email || loading}
        style={{ backgroundColor: brandColor }}
        className="w-full py-3 text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : sessionType.isFree ? (
          <><CheckCircle className="w-4 h-4" /> Confirm Booking</>
        ) : (
          <><CreditCard className="w-4 h-4" /> Confirm & Pay ₦{sessionType.price.toLocaleString()}</>
        )}
      </button>
    </motion.div>
  );
}
