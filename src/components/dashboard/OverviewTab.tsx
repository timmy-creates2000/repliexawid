import React, { useState, useEffect } from 'react';
import { Users, Zap, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { BusinessConfig } from '../../lib/types';
import { api } from '../../services/api';
import { getPlan } from '../../lib/plans';

function StatCard({ title, value, change }: { title: string; value: string; change: string }) {
  return (
    <div className="p-6 bg-black/40 border border-cyan-500/10 rounded-2xl scifi-border scifi-border-hover relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <Zap className="w-12 h-12 text-cyan-500" />
      </div>
      <p className="text-[10px] font-bold text-cyan-500/60 uppercase tracking-widest mb-2 font-mono">{title}</p>
      <div className="flex items-end justify-between relative z-10">
        <h4 className="text-3xl font-black tracking-tighter scifi-glow-text">{value}</h4>
        <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20 font-mono">
          {change}
        </span>
      </div>
    </div>
  );
}

interface Props {
  userId?: string;
  config: BusinessConfig;
}

export default function OverviewTab({ userId, config }: Props) {
  const [stats, setStats] = useState({ totalSales: 0, leadsCount: 0, conversionRate: 0 });
  const plan = getPlan(config.plan);

  const fetchStats = async () => {
    if (!userId) return;
    try {
      const data = await api.stats.get();
      setStats(data as any);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const simulateSale = async () => {
    if (!userId) return;
    await api.transactions.create({
      userId,
      amount: 5000 + Math.floor(Math.random() * 10000),
      method: 'paystack',
    });
    fetchStats();
  };

  const usageItems = [
    { label: 'Products', used: config.products.length, limit: plan.features.maxProducts },
    { label: 'Leads', used: stats.leadsCount, limit: plan.features.maxLeads },
    { label: 'AI Chats', used: config.chatCount ?? 0, limit: plan.features.maxChatsPerMonth },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          onClick={simulateSale}
          className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[10px] font-bold text-cyan-400 uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all"
        >
          Simulate Test Sale
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Sales" value={`₦${stats.totalSales.toLocaleString()}`} change="+0%" />
        <StatCard title="Active Leads" value={stats.leadsCount.toString()} change="+0" />
        <StatCard title="Conversion Rate" value={`${stats.conversionRate}%`} change="+0%" />
      </div>

      {/* Usage / Limits */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm uppercase tracking-widest">Plan Usage</h3>
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border"
            style={{ color: plan.color, borderColor: `${plan.color}40`, backgroundColor: `${plan.color}15` }}
          >
            {plan.name} Plan
          </span>
        </div>
        <div className="space-y-3">
          {usageItems.map((item) => {
            const unlimited = item.limit === -1;
            const pct = unlimited ? 0 : Math.min((item.used / item.limit) * 100, 100);
            const nearLimit = !unlimited && pct >= 80;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-white/40">{item.label}</span>
                  <span className={nearLimit ? 'text-amber-400' : 'text-white/60'}>
                    {item.used} / {unlimited ? '∞' : item.limit}
                  </span>
                </div>
                {!unlimited && (
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', nearLimit ? 'bg-amber-400' : 'bg-cyan-500')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">New Lead captured</p>
                  <p className="text-xs text-white/40">Via AI chat widget</p>
                </div>
              </div>
              <span className="text-xs text-white/40">2 hours ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
