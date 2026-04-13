import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import LandingPage from '../components/LandingPage';
import { api } from '../services/api';
import type { BusinessConfig } from '../lib/types';

function setMetaTag(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function mapConfigData(data: any, userId: string): BusinessConfig {
  return {
    userId,
    name: data.name || 'My Business',
    description: data.description || '',
    negotiationMode: !!data.negotiation_mode,
    brandColor: data.brand_color || '#ea580c',
    widgetPosition: data.widget_position || 'bottom-right',
    paymentMethod: data.payment_method || 'manual',
    bankDetails: {
      bankName: data.bank_name || '',
      accountNumber: data.account_number || '',
    },
    paystackKeys: data.paystack_public_key ? { publicKey: data.paystack_public_key } : undefined,
    flutterwaveKeys: data.flutterwave_public_key ? { publicKey: data.flutterwave_public_key } : undefined,
    stripeKeys: data.stripe_public_key ? { publicKey: data.stripe_public_key } : undefined,
    aiModel: data.ai_model || 'gemini',
    widgetBgStyle: data.widget_bg_style || 'dark',
    widgetBorderRadius: data.widget_border_radius || 'rounded',
    widgetAvatarUrl: data.widget_avatar_url || undefined,
    widgetWelcomeMessage: data.widget_welcome_message || undefined,
    widgetAutoOpenDelay: data.widget_auto_open_delay ?? 0,
    showPoweredBy: data.show_powered_by !== false,
    currency: data.currency || 'NGN',
    plan: data.plan || 'starter',
    chatCount: data.chat_count || 0,
    products: [],
  };
}

export default function BusinessLandingPage() {
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!config) return;
    const origin = window.location.origin;
    const url = `${origin}/b/${id}`;
    document.title = `${config.name} — Powered by Repliexa`;
    setMetaTag('og:title', config.name);
    setMetaTag('og:description', config.description || `Chat with ${config.name}`);
    setMetaTag('og:url', url);
    setMetaTag('og:type', 'website');
    if (config.widgetAvatarUrl) setMetaTag('og:image', config.widgetAvatarUrl);
  }, [config, id]);

  useEffect(() => {
    if (!id) return;
    api.config.search(id)
      .then(async (data: any) => {
        if (!data) { setNotFound(true); return; }
        const userId = data.user_id || data.userId;
        const base = mapConfigData(data, userId);
        try {
          const products = await api.products.list(userId);
          setConfig({ ...base, products: Array.isArray(products) ? products : [] });
        } catch {
          setConfig(base);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] scifi-grid flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.2)]" />
        <p className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-[0.3em] animate-pulse font-mono">
          Syncing with Node...
        </p>
      </div>
    );
  }

  if (notFound || !config) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] scifi-grid flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <Zap className="w-8 h-8" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-red-500">Business Not Found</h2>
          <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest">
            The requested business is inactive or invalid.
          </p>
        </div>
        <Link
          to="/"
          className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          Return to Hub
        </Link>
      </div>
    );
  }

  return <LandingPage config={config} />;
}
