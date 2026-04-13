import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useUser } from '@clerk/clerk-react';
import { Plus, Trash2, Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';
import type { SessionType, AvailabilityRule, Booking } from '../../lib/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Availability Rules Section ───────────────────────────────────────────────

function AvailabilitySection({ userId }: { userId: string }) {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', bufferMinutes: 15 });

  useEffect(() => {
    api.availability.list(userId).then(setRules).catch(console.error);
  }, [userId]);

  const save = async () => {
    await api.availability.save({ ...form, userId });
    const updated = await api.availability.list(userId);
    setRules(updated);
    setAdding(false);
    setForm({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', bufferMinutes: 15 });
  };

  const remove = async (id: string) => {
    await api.availability.delete(id);
    setRules(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase tracking-widest">Availability Rules</h3>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-500 transition-all border border-cyan-400/50"
        >
          <Plus className="w-3 h-3" /> Add Rule
        </button>
      </div>

      {adding && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Day</label>
              <select
                value={form.dayOfWeek}
                onChange={e => setForm(p => ({ ...p, dayOfWeek: Number(e.target.value) }))}
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-2 text-xs outline-none focus:border-cyan-500"
              >
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Buffer (min)</label>
              <input
                type="number"
                value={form.bufferMinutes}
                onChange={e => setForm(p => ({ ...p, bufferMinutes: Number(e.target.value) }))}
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-2 text-xs outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-2 text-xs outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-2 text-xs outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white">Cancel</button>
            <button onClick={save} className="px-4 py-1.5 bg-cyan-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-500 transition-all">Save</button>
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        {rules.map(rule => (
          <div key={rule.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl group">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-cyan-400/60" />
              <span className="text-xs font-bold">{DAYS[rule.dayOfWeek]}</span>
              <span className="text-[10px] text-white/40 font-mono">{rule.startTime} – {rule.endTime}</span>
              <span className="text-[10px] text-white/20 font-mono">{rule.bufferMinutes}min buffer</span>
            </div>
            <button onClick={() => remove(rule.id)} className="p-1.5 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {rules.length === 0 && !adding && (
          <p className="text-center text-white/20 py-6 text-[10px] uppercase tracking-widest font-mono italic">No availability rules set.</p>
        )}
      </div>
    </div>
  );
}

// ─── Session Types Section ────────────────────────────────────────────────────

function SessionTypesSection({ userId }: { userId: string }) {
  const [types, setTypes] = useState<SessionType[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', durationMinutes: 60, price: 0, isFree: false, description: '' });

  useEffect(() => {
    api.sessionTypes.list(userId).then(setTypes).catch(console.error);
  }, [userId]);

  const save = async () => {
    if (!form.name) return;
    await api.sessionTypes.save({ ...form, userId });
    const updated = await api.sessionTypes.list(userId);
    setTypes(updated as SessionType[]);
    setAdding(false);
    setForm({ name: '', durationMinutes: 60, price: 0, isFree: false, description: '' });
  };

  const remove = async (id: string) => {
    await api.sessionTypes.delete(id);
    setTypes(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase tracking-widest">Session Types</h3>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-500 transition-all border border-cyan-400/50"
        >
          <Plus className="w-3 h-3" /> Add Session
        </button>
      </div>

      {adding && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Session Name</label>
              <input
                placeholder="e.g. Discovery Call"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-2 text-xs outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Duration (min)</label>
              <input
                type="number"
                value={form.durationMinutes}
                onChange={e => setForm(p => ({ ...p, durationMinutes: Number(e.target.value) }))}
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-2 text-xs outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Price</label>
              <input
                type="number"
                value={form.price}
                disabled={form.isFree}
                onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-2 text-xs outline-none focus:border-cyan-500 disabled:opacity-40"
              />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <div
                onClick={() => setForm(p => ({ ...p, isFree: !p.isFree, price: !p.isFree ? 0 : p.price }))}
                className={cn('w-10 h-5 rounded-full relative cursor-pointer transition-colors', form.isFree ? 'bg-cyan-500' : 'bg-white/10')}
              >
                <motion.div animate={{ x: form.isFree ? 20 : 2 }} className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow" />
              </div>
              <span className="text-xs text-white/60">Free session</span>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Description</label>
              <textarea
                placeholder="What's included in this session?"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-2 text-xs outline-none focus:border-cyan-500 h-16 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white">Cancel</button>
            <button onClick={save} className="px-4 py-1.5 bg-cyan-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-500 transition-all">Save</button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {types.map(t => (
          <div key={t.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group">
            <div className="space-y-1">
              <p className="font-bold text-sm">{t.name}</p>
              <div className="flex items-center gap-3 text-[10px] text-white/40 font-mono">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.durationMinutes}min</span>
                <span className="text-cyan-400 font-bold">{t.isFree ? 'FREE' : `₦${t.price.toLocaleString()}`}</span>
              </div>
              {t.description && <p className="text-[10px] text-white/30 line-clamp-1">{t.description}</p>}
            </div>
            <button onClick={() => remove(t.id)} className="p-1.5 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {types.length === 0 && !adding && (
          <p className="col-span-2 text-center text-white/20 py-6 text-[10px] uppercase tracking-widest font-mono italic">No session types defined.</p>
        )}
      </div>
    </div>
  );
}

// ─── Bookings Calendar View ───────────────────────────────────────────────────

function BookingsCalendarView({ userId }: { userId: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const status = statusFilter === 'all' ? undefined : statusFilter;
    api.bookings.list(status).then(data => setBookings(data as Booking[])).catch(console.error);
  }, [statusFilter, userId]);

  const cancel = async (id: string) => {
    await api.bookings.updateStatus(id, 'cancelled');
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
  };

  const statusIcon = (status: string) => {
    if (status === 'confirmed') return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (status === 'cancelled') return <XCircle className="w-4 h-4 text-red-400" />;
    return <AlertCircle className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase tracking-widest">Upcoming Bookings</h3>
        <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
          {['all', 'pending', 'confirmed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn('px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all', statusFilter === s ? 'bg-cyan-600 text-white' : 'text-white/30 hover:text-white')}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {bookings.map(b => (
          <div key={b.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group">
            <div className="flex items-center gap-3">
              {statusIcon(b.status)}
              <div>
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-white/40" />
                  <span className="text-xs font-bold">{b.visitorName}</span>
                  <span className="text-[10px] text-white/40 font-mono">{b.visitorEmail}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Clock className="w-3 h-3 text-white/20" />
                  <span className="text-[10px] text-white/40 font-mono">
                    {new Date(b.startTime).toLocaleDateString()} · {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {b.meetLink && (
                    <a href={b.meetLink} target="_blank" rel="noreferrer" className="text-[10px] text-cyan-400 hover:underline">Meet Link</a>
                  )}
                </div>
              </div>
            </div>
            {b.status !== 'cancelled' && (
              <button
                onClick={() => cancel(b.id)}
                className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
              >
                Cancel
              </button>
            )}
          </div>
        ))}
        {bookings.length === 0 && (
          <p className="text-center text-white/20 py-8 text-[10px] uppercase tracking-widest font-mono italic">No bookings found.</p>
        )}
      </div>
    </div>
  );
}

// ─── Main BookingsTab ─────────────────────────────────────────────────────────

export default function BookingsTab() {
  const { user } = useUser();
  if (!user) return null;

  return (
    <div className="max-w-4xl space-y-10">
      <AvailabilitySection userId={user.id} />
      <div className="border-t border-white/10" />
      <SessionTypesSection userId={user.id} />
      <div className="border-t border-white/10" />
      <BookingsCalendarView userId={user.id} />
    </div>
  );
}
