import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, TrendingUp, Crown, Megaphone, Save, Plus, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';
import type { PlanConfig } from '../../lib/types';

const PLAN_COLORS: Record<string, string> = {
  starter: '#6b7280',
  pro: '#06b6d4',
  business: '#a855f7',
};

// ─── Users Section ────────────────────────────────────────────────────────────

function UsersSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    api.admin.users.list()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updatePlan = async (userId: string, plan: string) => {
    setSaving(userId);
    try {
      await api.admin.users.updatePlan(userId, plan);
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, plan } : u));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-cyan-400" />
        <h3 className="font-bold text-sm uppercase tracking-widest">All Users</h3>
        <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold rounded-full">{users.length}</span>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-5 py-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Business</th>
              <th className="px-5 py-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">User ID</th>
              <th className="px-5 py-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Joined</th>
              <th className="px-5 py-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Plan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-white/20 text-xs">Loading...</td></tr>
            ) : users.map(u => (
              <tr key={u.user_id} className="hover:bg-white/5 transition-colors">
                <td className="px-5 py-3 font-medium text-sm">{u.name || '—'}</td>
                <td className="px-5 py-3 text-[10px] text-white/30 font-mono">{u.user_id?.slice(0, 16)}...</td>
                <td className="px-5 py-3 text-xs text-white/40">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                <td className="px-5 py-3">
                  <select
                    value={u.plan || 'starter'}
                    onChange={e => updatePlan(u.user_id, e.target.value)}
                    disabled={saving === u.user_id}
                    className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-cyan-500 transition-all"
                    style={{ color: PLAN_COLORS[u.plan || 'starter'] }}
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                  </select>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-white/20 text-xs italic">No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Revenue Section ──────────────────────────────────────────────────────────

function RevenueSection() {
  const [revenue, setRevenue] = useState<any>(null);

  useEffect(() => {
    api.admin.revenue.get().then(setRevenue).catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-400" />
        <h3 className="font-bold text-sm uppercase tracking-widest">Revenue Overview</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {revenue?.totals?.map((t: any) => (
          <div key={t.currency} className="p-5 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{t.currency} Revenue</p>
            <p className="text-3xl font-black scifi-glow-text">
              {t.currency === 'NGN' ? '₦' : t.currency === 'USD' ? '$' : t.currency === 'GBP' ? '£' : '€'}
              {Number(t.total || 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-white/30 mt-1">{t.count} transactions</p>
          </div>
        ))}
        {!revenue && (
          <div className="col-span-2 p-5 bg-white/5 border border-white/10 rounded-2xl text-center text-white/20 text-xs italic">Loading revenue data...</div>
        )}
      </div>
      {revenue?.byPlan?.length > 0 && (
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">By Plan</p>
          {revenue.byPlan.map((p: any) => (
            <div key={p.plan} className="flex items-center justify-between">
              <span className="text-xs font-bold capitalize" style={{ color: PLAN_COLORS[p.plan] || '#fff' }}>{p.plan}</span>
              <span className="text-xs text-white/60">{p.txCount} txns · ₦{Number(p.revenue || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Plan Pricing Editor ──────────────────────────────────────────────────────

function PlanPricingEditor() {
  const [plans, setPlans] = useState<any[]>([]);
  const [editing, setEditing] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    api.admin.plans.list()
      .then(data => {
        setPlans(data as any[]);
        const init: Record<string, any> = {};
        (data as any[]).forEach((p: any) => { init[p.plan_id || p.planId] = { ...p }; });
        setEditing(init);
      })
      .catch(console.error);
  }, []);

  const save = async (planId: string) => {
    setSaving(planId);
    try {
      const d = editing[planId];
      await api.admin.plans.update(planId, {
        priceNgn: Number(d.price_ngn ?? d.priceNgn),
        priceUsd: Number(d.price_usd ?? d.priceUsd),
        maxProducts: Number(d.max_products ?? d.maxProducts),
        maxLeads: Number(d.max_leads ?? d.maxLeads),
        maxChats: Number(d.max_chats ?? d.maxChats),
      } as any);
      setSaved(planId);
      setTimeout(() => setSaved(null), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  const update = (planId: string, field: string, value: any) => {
    setEditing(prev => ({ ...prev, [planId]: { ...prev[planId], [field]: value } }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Crown className="w-5 h-5 text-amber-400" />
        <h3 className="font-bold text-sm uppercase tracking-widest">Plan Pricing Editor</h3>
      </div>
      <p className="text-xs text-white/30">Changes take effect immediately — no redeployment needed.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan: any) => {
          const id = plan.plan_id || plan.planId;
          const d = editing[id] || plan;
          const color = PLAN_COLORS[id] || '#fff';
          return (
            <div key={id} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
              <p className="text-sm font-black uppercase tracking-widest" style={{ color }}>{id}</p>
              <div className="space-y-2">
                {[
                  { label: 'Price NGN (₦)', field: 'price_ngn' },
                  { label: 'Price USD ($)', field: 'price_usd' },
                  { label: 'Max Products (-1=∞)', field: 'max_products' },
                  { label: 'Max Leads (-1=∞)', field: 'max_leads' },
                  { label: 'Max Chats (-1=∞)', field: 'max_chats' },
                ].map(({ label, field }) => (
                  <div key={field} className="space-y-1">
                    <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{label}</label>
                    <input
                      type="number"
                      value={d[field] ?? ''}
                      onChange={e => update(id, field, e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => save(id)}
                disabled={saving === id}
                className="w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1 border"
                style={{ backgroundColor: `${color}20`, borderColor: `${color}40`, color }}
              >
                {saving === id ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> :
                 saved === id ? <><CheckCircle className="w-3 h-3" /> Saved!</> :
                 <><Save className="w-3 h-3" /> Save</>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Announcements Section ────────────────────────────────────────────────────

function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    api.admin.announcements.list().then(setAnnouncements).catch(console.error);
  }, []);

  const post = async () => {
    if (!newMsg.trim()) return;
    setPosting(true);
    try {
      await api.admin.announcements.create(newMsg.trim());
      const updated = await api.admin.announcements.list();
      setAnnouncements(updated);
      setNewMsg('');
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const toggle = async (id: string, isActive: boolean) => {
    await api.admin.announcements.toggle(id, isActive);
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_active: isActive ? 1 : 0 } : a));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-amber-400" />
        <h3 className="font-bold text-sm uppercase tracking-widest">Announcements</h3>
      </div>

      <div className="flex gap-3">
        <input
          placeholder="Write an announcement to all users..."
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && post()}
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-cyan-500 transition-all"
        />
        <button
          onClick={post}
          disabled={posting || !newMsg.trim()}
          className="flex items-center gap-1 px-4 py-2 bg-amber-500 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-40"
        >
          <Plus className="w-3 h-3" /> Post
        </button>
      </div>

      <div className="space-y-2">
        {announcements.map(a => (
          <div key={a.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl gap-3">
            <p className="text-xs flex-1">{a.message}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={cn('text-[9px] font-bold uppercase tracking-widest', a.is_active ? 'text-green-400' : 'text-white/20')}>
                {a.is_active ? 'Active' : 'Hidden'}
              </span>
              <button
                onClick={() => toggle(a.id, !a.is_active)}
                className={cn('p-1.5 rounded-lg transition-all', a.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white')}
              >
                {a.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <p className="text-center text-white/20 py-4 text-[10px] uppercase tracking-widest font-mono italic">No announcements yet.</p>
        )}
      </div>
    </div>
  );
}

// ─── Main AdminTab ────────────────────────────────────────────────────────────

export default function AdminTab() {
  return (
    <div className="max-w-5xl space-y-12">
      <UsersSection />
      <div className="border-t border-white/10" />
      <RevenueSection />
      <div className="border-t border-white/10" />
      <PlanPricingEditor />
      <div className="border-t border-white/10" />
      <AnnouncementsSection />
    </div>
  );
}
