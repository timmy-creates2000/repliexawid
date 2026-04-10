import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, Link } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp, useUser } from '@clerk/clerk-react';
import BusinessLandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ChatWidget from './components/ChatWidget';
import { BusinessConfig } from './lib/gemini';
import { Zap, ShieldAlert } from 'lucide-react';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function AuthenticatedApp() {
  const { user } = useUser();
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch(`/api/config/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            // Map DB fields to BusinessConfig interface
            setConfig({
              userId: user.id,
              name: data.name || "My Business",
              description: data.description || "",
              negotiationMode: !!data.negotiation_mode,
              brandColor: data.brand_color || "#ea580c",
              widgetPosition: data.widget_position || "bottom-right",
              paymentMethod: data.payment_method || "manual",
              bankDetails: {
                bankName: data.bank_name || "",
                accountNumber: data.account_number || ""
              },
              flutterwaveKeys: {
                publicKey: data.flutterwave_public_key || "",
                secretKey: data.flutterwave_secret_key || ""
              },
              paystackKeys: {
                publicKey: data.paystack_public_key || "",
                secretKey: data.paystack_secret_key || ""
              },
              paymentKeys: data.payment_method === 'flutterwave' 
                ? { publicKey: data.flutterwave_public_key || "", secretKey: data.flutterwave_secret_key || "" }
                : { publicKey: data.paystack_public_key || "", secretKey: data.paystack_secret_key || "" },
              googleClientId: data.google_client_id || "",
              composerIp: data.composer_ip || "",
              composerApiKey: data.composer_api_key || "",
              products: [] // Fetch products separately if needed
            });
          } else {
            // Default config
            setConfig({
              userId: user.id,
              name: "New Business",
              description: "Welcome to our business!",
              products: [],
              negotiationMode: true,
              paymentMethod: 'manual',
              brandColor: '#ea580c',
              widgetPosition: 'bottom-right'
            });
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch config:", err);
          // Fallback to default config on error
          setConfig({
            userId: user.id,
            name: "Repliexa Node",
            description: "Neural sales interface active.",
            products: [],
            negotiationMode: true,
            paymentMethod: 'manual',
            brandColor: '#06b6d4',
            widgetPosition: 'bottom-right'
          });
          setLoading(false);
        });
    }
  }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] scifi-grid flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.2)]" />
      <p className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-[0.3em] animate-pulse font-mono">Initializing Neural Link...</p>
    </div>
  );

  return (
    <>
      <Dashboard config={config} setConfig={setConfig} />
      <ChatWidget config={config} />
    </>
  );
}

function PublicBusinessPage() {
  const { id } = useParams();
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // In a real app, you might have a slug mapping, but for now we'll try to fetch by ID or name
      // For this demo, we'll assume the ID is the userId or we search by name
      fetch(`/api/config/search?query=${id}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            const businessConfig = {
              userId: data.user_id,
              name: data.name || "My Business",
              description: data.description || "",
              negotiationMode: !!data.negotiation_mode,
              brandColor: data.brand_color || "#ea580c",
              widgetPosition: data.widget_position || "bottom-right",
              paymentMethod: data.payment_method || "manual",
              bankDetails: {
                bankName: data.bank_name || "",
                accountNumber: data.account_number || ""
              },
              products: []
            };

            // Fetch products
            fetch(`/api/products/${data.user_id}`)
              .then(res => res.json())
              .then(products => {
                if (Array.isArray(products)) {
                  setConfig({ ...businessConfig, products });
                } else {
                  setConfig(businessConfig);
                }
              })
              .catch(() => setConfig(businessConfig))
              .finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    }
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] scifi-grid flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.2)]" />
      <p className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-[0.3em] animate-pulse font-mono">Syncing with Node...</p>
    </div>
  );

  if (!config) return (
    <div className="min-h-screen bg-[#0a0a0a] scifi-grid flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
        <Zap className="w-8 h-8" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-red-500">Node Not Found</h2>
        <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest">The requested neural address is inactive or invalid.</p>
      </div>
      <Link to="/" className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Return to Hub</Link>
    </div>
  );

  return <BusinessLandingPage config={config} />;
}

export default function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-black uppercase tracking-tighter scifi-glow-text">Setup Required</h1>
          <p className="text-white/60 font-mono text-xs uppercase tracking-widest">
            Please add your <code className="text-cyan-400">VITE_CLERK_PUBLISHABLE_KEY</code> to the environment variables in the Settings menu to enable authentication and the dashboard.
          </p>
          <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-xl text-left text-[10px] font-mono text-cyan-400/60">
            VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
          </div>
        </div>
      </div>
    );
  }

  // Mock initial config for landing page (in real app, fetch by business ID)
  const [defaultConfig] = useState<BusinessConfig>({
    userId: "mock-user-id",
    name: "Repliexa Corp",
    description: "Advanced neural sales interfaces for the next generation of digital commerce.",
    products: [
      { id: '1', name: 'Neural Link Module', price: 50000, lastPrice: 45000, type: 'digital', description: 'Direct interface for sales automation.' },
      { id: '2', name: 'Quantum Strategy Session', price: 150000, lastPrice: 120000, type: 'service', description: 'High-level consulting for digital ecosystems.' },
    ],
    negotiationMode: true,
    paymentMethod: 'flutterwave',
    bankDetails: {
      bankName: 'Cyber Bank',
      accountNumber: '0000000000'
    },
    brandColor: '#06b6d4',
    widgetPosition: 'bottom-right'
  });

  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      forceRedirectUrl="/dashboard"
    >
      <Router>
        <div className="min-h-screen bg-black text-white">
          <Routes>
            <Route path="/" element={<BusinessLandingPage config={defaultConfig} />} />
            <Route path="/b/:id" element={<PublicBusinessPage />} />
            <Route 
              path="/sign-in/*" 
              element={
                <div className="min-h-screen bg-[#0a0a0a] scifi-grid flex items-center justify-center p-4">
                  <SignIn routing="path" path="/sign-in" forceRedirectUrl="/dashboard" />
                </div>
              } 
            />
            <Route 
              path="/sign-up/*" 
              element={
                <div className="min-h-screen bg-[#0a0a0a] scifi-grid flex items-center justify-center p-4">
                  <SignUp routing="path" path="/sign-up" forceRedirectUrl="/dashboard" />
                </div>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <>
                  <SignedIn>
                    <AuthenticatedApp />
                  </SignedIn>
                  <SignedOut>
                    <Navigate to="/sign-in" />
                  </SignedOut>
                </>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </ClerkProvider>
  );
}
