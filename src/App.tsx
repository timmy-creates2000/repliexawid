import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { Zap } from 'lucide-react';

import { api, setTokenProvider } from './services/api';
import { useAuth } from '@clerk/clerk-react';
import type { BusinessConfig } from './lib/types';

import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ChatWidget from './components/ChatWidget';

import DashboardPage from './pages/DashboardPage';
import BusinessLandingPage from './pages/BusinessLandingPage';
import ChatPage from './pages/ChatPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// ─── Map raw DB row → BusinessConfig ─────────────────────────────────────────

function mapDbToConfig(data: any, userId: string): BusinessConfig {
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
    googleClientId: data.google_client_id || undefined,
    googleAccessToken: data.google_access_token || undefined,
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

// ─── Authenticated App ────────────────────────────────────────────────────────

function AuthenticatedApp() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Wire Clerk token into api service
  useEffect(() => {
    setTokenProvider(() => getToken());
  }, [getToken]);

  useEffect(() => {
    if (!user) return;
    api.config.get(user.id)
      .then((data: any) => {
        if (data) {
          setConfig(mapDbToConfig(data, user.id));
        } else {
          setConfig({
            userId: user.id,
            name: 'New Business',
            description: 'Welcome to our business!',
            products: [],
            negotiationMode: true,
            paymentMethod: 'manual',
            brandColor: '#ea580c',
            widgetPosition: 'bottom-right',
            widgetBgStyle: 'dark',
            widgetBorderRadius: 'rounded',
            widgetAutoOpenDelay: 0,
            showPoweredBy: true,
            currency: 'NGN',
            aiModel: 'gemini',
            plan: 'starter',
            chatCount: 0,
          });
        }
      })
      .catch(() => {
        setConfig({
          userId: user.id,
          name: 'Repliexa Node',
          description: 'Neural sales interface active.',
          products: [],
          negotiationMode: true,
          paymentMethod: 'manual',
          brandColor: '#06b6d4',
          widgetPosition: 'bottom-right',
          widgetBgStyle: 'dark',
          widgetBorderRadius: 'rounded',
          widgetAutoOpenDelay: 0,
          showPoweredBy: true,
          currency: 'NGN',
          aiModel: 'gemini',
          plan: 'starter',
          chatCount: 0,
        });
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] scifi-grid flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.2)]" />
        <p className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-[0.3em] animate-pulse font-mono">
          Initializing Neural Link...
        </p>
      </div>
    );
  }

  return (
    <>
      <Dashboard config={config} setConfig={setConfig} />
      <ChatWidget config={config!} />
    </>
  );
}

// ─── Default landing config ───────────────────────────────────────────────────

const DEFAULT_CONFIG: BusinessConfig = {
  userId: 'mock-user-id',
  name: 'Repliexa Corp',
  description: 'Advanced neural sales interfaces for the next generation of digital commerce.',
  products: [
    { id: '1', name: 'Neural Link Module', price: 50000, lastPrice: 45000, type: 'digital', description: 'Direct interface for sales automation.' },
    { id: '2', name: 'Quantum Strategy Session', price: 150000, lastPrice: 120000, type: 'service', description: 'High-level consulting for digital ecosystems.' },
  ],
  negotiationMode: true,
  paymentMethod: 'flutterwave',
  bankDetails: { bankName: 'Cyber Bank', accountNumber: '0000000000' },
  brandColor: '#06b6d4',
  widgetPosition: 'bottom-right',
  widgetBgStyle: 'dark',
  widgetBorderRadius: 'rounded',
  widgetAutoOpenDelay: 0,
  showPoweredBy: true,
  currency: 'NGN',
  aiModel: 'gemini',
  plan: 'starter',
  chatCount: 0,
};

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-black uppercase tracking-tighter scifi-glow-text">Setup Required</h1>
          <p className="text-white/60 font-mono text-xs uppercase tracking-widest">
            Please add your <code className="text-cyan-400">VITE_CLERK_PUBLISHABLE_KEY</code> to the environment variables.
          </p>
          <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-xl text-left text-[10px] font-mono text-cyan-400/60">
            VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      fallbackRedirectUrl="/dashboard"
      appearance={{
        variables: {
          colorPrimary: '#06b6d4',
          colorBackground: '#0a0a0a',
          colorText: '#ffffff',
          colorTextSecondary: 'rgba(255, 255, 255, 0.6)',
          colorInputBackground: '#111111',
          colorInputText: '#ffffff',
          borderRadius: '12px',
        },
        elements: {
          card: 'border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)] bg-black/80 backdrop-blur-xl',
          headerTitle: 'text-2xl font-black uppercase tracking-tighter italic scifi-glow-text',
          headerSubtitle: 'text-[10px] font-bold uppercase tracking-widest text-white/40 font-mono',
          socialButtonsBlockButton: 'bg-white/5 border border-white/10 hover:bg-white/10 transition-all',
          socialButtonsBlockButtonText: 'text-xs font-bold uppercase tracking-widest',
          formButtonPrimary: 'bg-cyan-600 hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] border border-cyan-400/50 uppercase tracking-widest text-xs font-black py-3',
          footerActionLink: 'text-cyan-400 hover:text-cyan-300 transition-colors font-bold',
          formFieldLabel: 'text-[10px] font-bold uppercase tracking-widest text-white/60 font-mono',
          formFieldInput: 'bg-black/40 border border-white/10 focus:border-cyan-500/50 transition-all text-sm',
          dividerLine: 'bg-white/10',
          dividerText: 'text-[10px] font-bold uppercase tracking-widest text-white/20 font-mono',
        },
      }}
    >
      <Router>
        <div className="min-h-screen bg-black text-white">
          <Routes>
            <Route path="/" element={<LandingPage config={DEFAULT_CONFIG} />} />
            <Route path="/b/:id" element={<BusinessLandingPage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />
            <Route
              path="/dashboard"
              element={
                <>
                  <SignedIn>
                    <AuthenticatedApp />
                  </SignedIn>
                  <SignedOut>
                    <Navigate to="/sign-in" replace />
                  </SignedOut>
                </>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ClerkProvider>
  );
}
