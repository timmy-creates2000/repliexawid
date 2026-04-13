import React from 'react';
import { CreditCard } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BusinessConfig, Currency } from '../../lib/types';

interface Props {
  config: BusinessConfig;
  setConfig: React.Dispatch<React.SetStateAction<BusinessConfig>>;
}

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'NGN', label: '₦ Nigerian Naira (NGN)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'GBP', label: '£ British Pound (GBP)' },
];

type PaymentMethodOption = 'flutterwave' | 'paystack' | 'stripe' | 'manual';

export default function PaymentsTab({ config, setConfig }: Props) {
  const method = config.paymentMethod as PaymentMethodOption;
  const setMethod = (m: PaymentMethodOption) => setConfig((prev) => ({ ...prev, paymentMethod: m }));

  return (
    <div className="max-w-4xl space-y-8">
      <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
        <h3 className="text-xl font-bold">Customer Payment Methods</h3>
        <p className="text-sm text-white/40">
          Choose how your customers pay you. You can enable multiple methods.
        </p>

        {/* Currency Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Currency</label>
          <select
            value={config.currency ?? 'NGN'}
            onChange={(e) => setConfig((prev) => ({ ...prev, currency: e.target.value as Currency }))}
            className="bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Method Selector */}
        <div className="flex flex-wrap gap-4">
          {(['flutterwave', 'paystack', 'stripe', 'manual'] as PaymentMethodOption[]).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={cn(
                'px-6 py-3 rounded-xl text-[10px] font-bold border transition-all uppercase tracking-widest',
                method === m
                  ? 'bg-cyan-600 border-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]'
                  : 'bg-white/5 border-white/10 text-white/40',
              )}
            >
              {m === 'manual' ? 'Manual Transfer' : m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <div className="pt-6 border-t border-white/10">
          {method === 'flutterwave' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Public Key</label>
                  <input
                    type="password"
                    placeholder="FLWPUBK_..."
                    className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-4 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
                    value={config.flutterwaveKeys?.publicKey || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        flutterwaveKeys: { ...(prev.flutterwaveKeys || { publicKey: '' }), publicKey: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Secret Key</label>
                  <input
                    type="password"
                    placeholder="FLWSECK_..."
                    className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-4 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
                    value={(config.flutterwaveKeys as any)?.secretKey || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        flutterwaveKeys: { ...(prev.flutterwaveKeys || { publicKey: '' }), secretKey: e.target.value } as any,
                      }))
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-white/40">Best for international and multi-currency payments.</p>
            </div>
          )}

          {method === 'paystack' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Public Key</label>
                  <input
                    type="password"
                    placeholder="pk_test_..."
                    className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-4 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
                    value={config.paystackKeys?.publicKey || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        paystackKeys: { ...(prev.paystackKeys || { publicKey: '' }), publicKey: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Secret Key</label>
                  <input
                    type="password"
                    placeholder="sk_test_..."
                    className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-4 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
                    value={(config.paystackKeys as any)?.secretKey || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        paystackKeys: { ...(prev.paystackKeys || { publicKey: '' }), secretKey: e.target.value } as any,
                      }))
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-white/40">Highly recommended for Nigerian businesses. Fast setup and reliable.</p>
            </div>
          )}

          {method === 'stripe' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Publishable Key</label>
                  <input
                    type="password"
                    placeholder="pk_test_..."
                    className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-4 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
                    value={config.stripeKeys?.publicKey || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        stripeKeys: { ...(prev.stripeKeys || { publicKey: '' }), publicKey: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Secret Key</label>
                  <input
                    type="password"
                    placeholder="sk_test_..."
                    className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-4 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
                    value={(config.stripeKeys as any)?.secretKey || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        stripeKeys: { ...(prev.stripeKeys || { publicKey: '' }), secretKey: e.target.value } as any,
                      }))
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-white/40">Best for global payments. Supports cards, Apple Pay, and more.</p>
            </div>
          )}

          {method === 'manual' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Bank Name</label>
                  <input
                    placeholder="e.g. Zenith Bank"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-green-500"
                    value={config.bankDetails?.bankName || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        bankDetails: { ...prev.bankDetails!, bankName: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Account Number</label>
                  <input
                    placeholder="0123456789"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-green-500"
                    value={config.bankDetails?.accountNumber || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        bankDetails: { ...prev.bankDetails!, accountNumber: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-white/40">
                AI will provide these details to customers. You must manually confirm payments.
              </p>
            </div>
          )}
        </div>

        <button className="px-8 py-3 bg-cyan-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] border border-cyan-400/50">
          Save Payment Settings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">SaaS Subscription</h3>
            <span className="px-3 py-1 bg-cyan-600/20 text-cyan-400 text-[10px] font-bold rounded-full uppercase tracking-widest border border-cyan-500/30">
              Free Trial
            </span>
          </div>
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest">
            Your Repliexa AI subscription status.
          </p>
          <div className="pt-4 border-t border-white/10">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/40">Next Billing Date</span>
              <span>April 16, 2026</span>
            </div>
          </div>
        </div>

        <div className="p-8 bg-cyan-600 rounded-3xl space-y-6 shadow-2xl shadow-cyan-600/20 border border-cyan-400/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <h3 className="text-xl font-black uppercase tracking-tighter italic relative z-10">Upgrade to Pro</h3>
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-4xl font-black scifi-glow-text">₦2,500</span>
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">/ month</span>
          </div>
          <button className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-cyan-50 transition-all relative z-10">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}
