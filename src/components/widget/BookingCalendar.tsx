import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';
import type { TimeSlot, SessionType } from '../../lib/types';
import BookingConfirm from './BookingConfirm';

interface BookingCalendarProps {
  userId: string;
  brandColor: string;
  onClose: () => void;
  onBooked: (bookingId: string) => void;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BookingCalendar({ userId, brandColor, onClose, onBooked }: BookingCalendarProps) {
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [selectedType, setSelectedType] = useState<SessionType | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);

  // Load session types
  useEffect(() => {
    api.sessionTypes.list(userId)
      .then(data => {
        setSessionTypes(data as SessionType[]);
        if (data.length > 0) setSelectedType(data[0] as SessionType);
      })
      .catch(console.error);
  }, [userId]);

  // Load slots when session type or week changes
  useEffect(() => {
    if (!selectedType) return;
    setLoading(true);
    const start = formatDate(weekStart);
    const end = formatDate(addDays(weekStart, 6));
    api.slots.get(userId, start, end, selectedType.id)
      .then(data => setSlots(data.slots))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, selectedType, weekStart]);

  // Group slots by date
  const slotsByDate: Record<string, TimeSlot[]> = {};
  for (const slot of slots) {
    const date = slot.start.split('T')[0];
    if (!slotsByDate[date]) slotsByDate[date] = [];
    slotsByDate[date].push(slot);
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  if (selectedSlot && selectedType) {
    return (
      <BookingConfirm
        slot={selectedSlot}
        sessionType={selectedType}
        userId={userId}
        brandColor={brandColor}
        onConfirmed={onBooked}
        onBack={() => setSelectedSlot(null)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mx-4 mb-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Book a Session</p>
        </div>
        <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Session Type Selector */}
      {sessionTypes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {sessionTypes.map(st => (
            <button
              key={st.id}
              onClick={() => setSelectedType(st)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex-shrink-0 transition-all border',
                selectedType?.id === st.id
                  ? 'text-white border-transparent'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
              )}
              style={selectedType?.id === st.id ? { backgroundColor: brandColor, borderColor: `${brandColor}80` } : {}}
            >
              {st.name} · {st.isFree ? 'Free' : `₦${st.price.toLocaleString()}`}
            </button>
          ))}
        </div>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekStart(prev => addDays(prev, -7))}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
          {weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })} –{' '}
          {addDays(weekStart, 6).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
        </span>
        <button
          onClick={() => setWeekStart(prev => addDays(prev, 7))}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day columns */}
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => {
            const dateStr = formatDate(day);
            const daySlots = slotsByDate[dateStr] ?? [];
            const isToday = formatDate(new Date()) === dateStr;
            return (
              <div key={dateStr} className="space-y-1">
                <div className={cn('text-center text-[9px] font-bold uppercase tracking-widest pb-1', isToday ? 'text-cyan-400' : 'text-white/30')}>
                  <div>{DAY_LABELS[day.getDay()]}</div>
                  <div className={cn('text-[10px]', isToday ? 'text-cyan-400' : 'text-white/50')}>{day.getDate()}</div>
                </div>
                {daySlots.slice(0, 4).map(slot => (
                  <button
                    key={slot.start}
                    onClick={() => setSelectedSlot(slot)}
                    className="w-full py-1 rounded text-[8px] font-bold text-center transition-all hover:text-white"
                    style={{ backgroundColor: `${brandColor}20`, color: brandColor, border: `1px solid ${brandColor}40` }}
                  >
                    {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </button>
                ))}
                {daySlots.length === 0 && (
                  <div className="w-full py-1 text-center text-[8px] text-white/10">—</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {slots.length === 0 && !loading && (
        <p className="text-center text-[10px] text-white/30 font-mono uppercase tracking-widest py-2">
          No available slots this week.
        </p>
      )}
    </motion.div>
  );
}
