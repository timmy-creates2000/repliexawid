import React, { useState, useEffect } from 'react';
import { CheckCircle, Zap } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { cn } from '../../lib/utils';
import { BusinessConfig, PlanConfig, PlanId, Currency } from '../../lib/types';
import { api } from '../../services/api';
import { PLANS } from '../../lib/plans';

interface Props {
  currentPlan?: string;
  userId?: string;
  setConfig: React.Dispatch<React.SetStateAction<BusinessConfig>>;
  config: BusinessConfig;
}

const PLAN_COLORS: Record<string, string> = {
  starter: '#6b7280',
  pro: '#06b6d4',
  business: '#a855f7',
};

// ─── Flutterwave loader ───────────────────────────────────────────────────────

function loadFlutterwave(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).FlutterwaveCheckout) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UpgradeTab({ currentPlan, userId, setConfig, config }: Props) {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [currency, setCurrency] = useState<Currency>(config.currency || 'NGN');
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    api.plans.list()
      .then(data => { if (Array.isArray(data) && data.length > 0) setPlans(data); })
      .catch(console.error);
  }, []);

  const handleUpgrade = async (planId: PlanId, priceNgn: number, priceUsd: number) => {
    if (!userId || !user) return;

    const amount = currency === 'NGN' ? priceNgn : priceUsd;

    // Free plan — just downgrade directly
    if (amount === 0) {
      setLoading(planId);
      try {
        await api.config.updatePlan(planId);
        setConfig(prev => ({ ...prev, plan: planId }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(null);
      }
      return;
    }

    setLoading(planId);

    try {
      await loadFlutterwave();

      const reference = `SUB-${userId.slice(-8)}-${planId.toUpperCase()}-${Date.now()}`;
      const email = user.primaryEmailAddress?.emailAddress || '';
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || email;
      const publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-49a174e7e3a2cb0d04c3da6ac2666810-X';

      (window as any).FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: reference,
        amount,
        currency,
        payment_options: 'card,banktransfer,ussd,mobilemoney',
        customer: { email, name },
        customizations: {
          title: `Repliexa ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
          description: `Monthly subscription to Repliexa ${planId}`,
        },
        callback: async (response: any) => {
          if (response.status === 'successful') {
            // Optimistically upgrade plan in UI
            // Webhook will confirm on the backend
            setConfig(prev => ({ ...prev, plan: planId }));
            setSuccess(planId);
            // Also update via API
            try { await api.config.updatePlan(planId); } catch {}
            setTimeout(() => setSuccess(null), 5000);
          }
          setLoading(null);
        },
        onclose: () => setLoading(null),
      });
    } catch (err: any) {
      console.error('[UpgradeTab] Payment error:', err);
      alert(err.message || 'Payment failed. Please try again.');
      setLoading(null);
    }
  };

  const displayPlans = plans.length > 0 ? plans : Object.values(PLANS).map(p => ({
    planId: p.planId,
    priceNgn: p.priceNgn,
    priceUsd: p.priceUsd,
    maxProducts: p.maxProducts,
    maxLeads: p.maxLeads,
    maxChats: p.maxChats,
    features: p.features,
  }));

  return (
    <div className="max-w-5xl space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tighter scifi-glow-text">Choose Your Plan</h2>
        <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Scale your AI sales operation</p>
      </div>

      {/* Currency Toggle */}
      <div className="flex justify-center">
        <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
          {(['NGN', 'USD'] as Currency[]).map(c => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={cn(
                'px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all',
                currency === c ? 'bg-cyan-600 text-white' : 'text-white/40 hover:text-white'
              )}
            >
              {c === 'NGN' ? '₦ NGN' : '$ USD'}
            </button>
          ))}
        </div>
      </div>

      {/* Success banner */}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-400 font-bold">
            Payment successful! Your plan is being upgraded. This may take a moment.
          </p>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayPlans.map(plan => {
          const isCurrent = (currentPlan ?? 'starter') === plan.planId;
          const color = PLAN_COLORS[plan.planId] ?? '#06b6d4';
          const price = currency === 'NGN' ? plan.priceNgn : plan.priceUsd;
          const symbol = currency === 'NGN' ? '₦' : '$';
          const isFree = price === 0;

          const highlights = [
            plan.maxProducts === -1 ? 'Unlimited products' : `${plan.maxProducts} products`,
            plan.maxLeads === -1 ? 'Unlimited leads' : `${plan.maxLeads} leads/month`,
            plan.maxChats === -1 ? 'Unlimited AI chats' : `${plan.maxChats?.toLocaleString()} AI chats/month`,
            ...(plan.features?.canEmbed ? ['Website embed'] : []),
            ...(plan.features?.negotiationMode ? ['Negotiation mode'] : []),
            ...(plan.features?.aiModels?.length > 1 ? ['All AI models'] : ['Gemini AI only']),
            ...(plan.features?.prioritySupport ? ['Priority support'] : []),
          ];

          return (
            <div
              key={plan.planId}
              className={cn(
                'p-8 rounded-3xl border space-y-6 relative overflow-hidden transition-all',
                isCurrent
                  ? 'border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_30px_rgba(6,182,212,0.1)]'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              )}
            >
              {isCurrent && (
                <div className="absolute top-4 right-4 px-2 py-1 bg-cyan-600 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" /> Active
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color }}>
                  {plan.planId.charAt(0).toUpperCase() + plan.planId.slice(1)}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">
                    {isFree ? 'Free' : `${symbol}${price?.toLocaleString()}`}
                  </span>
                  {!isFree && <span className="text-white/40 text-xs font-bold">/month</span>}
                </div>
              </div>

              <ul className="space-y-2">
                {highlights.map(h => (
                  <li key={h} className="flex items-center gap-2 text-xs text-white/60">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                    {h}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !isCurrent && handleUpgrade(plan.planId as PlanId, plan.priceNgn, plan.priceUsd)}
                disabled={isCurrent || loading === plan.planId}
                className={cn(
                  'w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2',
                  isCurrent
                    ? 'bg-white/5 border-white/10 text-white/20 cursor-default'
                    : 'text-white hover:opacity-90'
                )}
                style={!isCurrent ? { backgroundColor: color, borderColor: `${color}80` } : {}}
              >
                {loading === plan.planId ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isCurrent ? 'Active Plan' : isFree ? 'Downgrade' : `Pay ${symbol}${price?.toLocaleString()}/mo`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
        <h3 className="font-bold text-sm mb-4 uppercase tracking-widest">Feature Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 text-white/40 font-bold uppercase tracking-widest">Feature</th>
                {displayPlans.map(p => (
                  <th key={p.planId} className="text-center py-3 font-bold uppercase tracking-widest" style={{ color: PLAN_COLORS[p.planId] }}>
                    {p.planId.charAt(0).toUpperCase() + p.planId.slice(1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { label: 'Products', fn: (p: PlanConfig) => p.maxProducts === -1 ? '∞' : p.maxProducts },
                { label: 'Leads/month', fn: (p: PlanConfig) => p.maxLeads === -1 ? '∞' : p.maxLeads },
                { label: 'AI Chats/month', fn: (p: PlanConfig) => p.maxChats === -1 ? '∞' : p.maxChats?.toLocaleString() },
                { label: 'Website Embed', fn: (p: PlanConfig) => p.features?.canEmbed ? '✓' : '—' },
                { label: 'Negotiation Mode', fn: (p: PlanConfig) => p.features?.negotiationMode ? '✓' : '—' },
                { label: 'All AI Models', fn: (p: PlanConfig) => (p.features?.aiModels?.length ?? 0) > 1 ? '✓' : 'Gemini only' },
                { label: 'Priority Support', fn: (p: PlanConfig) => p.features?.prioritySupport ? '✓' : '—' },
              ].map(row => (
                <tr key={row.label}>
                  <td className="py-3 text-white/40">{row.label}</td>
                  {displayPlans.map(p => (
                    <td key={p.planId} className="py-3 text-center text-white/60">{row.fn(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment note */}
      <p className="text-center text-[10px] text-white/20 font-mono">
        Payments processed securely via Flutterwave · Subscriptions renew monthly · Cancel anytime
      </p>
    </div>
  );
}
