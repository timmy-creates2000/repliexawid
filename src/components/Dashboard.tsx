import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser, UserButton } from '@clerk/clerk-react';
import {
  LayoutDashboard, Package, Users, Settings, Save, CreditCard,
  MessageSquare, Zap, Globe, Wallet, ShieldCheck, BookOpen,
  Share2, Crown, Sparkles, CheckCircle, AlertCircle, X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { BusinessConfig } from '../lib/types';
import { api } from '../services/api';
import { getPlan } from '../lib/plans';

// Tab components
import SidebarItem from './dashboard/SidebarItem';
import OverviewTab from './dashboard/OverviewTab';
import WalletTab from './dashboard/WalletTab';
import ProductsTab from './dashboard/ProductsTab';
import LeadsTab from './dashboard/LeadsTab';
import AgentConfigTab from './dashboard/AgentConfigTab';
import PaymentsTab from './dashboard/PaymentsTab';
import IntegrationsTab from './dashboard/IntegrationsTab';
import ShareTab from './dashboard/ShareTab';
import BookingsTab from './dashboard/BookingsTab';
import UpgradeTab from './dashboard/UpgradeTab';
import AdminTab from './dashboard/AdminTab';

export default function Dashboard({
  config,
  setConfig,
}: {
  config: BusinessConfig;
  setConfig: React.Dispatch<React.SetStateAction<BusinessConfig>>;
}) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const plan = getPlan(config.plan);
  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'adeniyigideon56@gmail.com';

  const isOnboarded =
    config.name !== 'New Business' &&
    config.products.length > 0 &&
    config.paymentMethod !== 'manual';

  // Fetch active announcement on mount
  useEffect(() => {
    api.announcements
      .list()
      .then((data) => {
        const active = data.find((a) => a.isActive);
        if (active) setAnnouncement(active.message);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      await api.config.save({
        userId: user.id,
        name: config.name,
        description: config.description,
        negotiationMode: config.negotiationMode,
        brandColor: config.brandColor,
        widgetPosition: config.widgetPosition,
        paymentMethod: config.paymentMethod,
        aiModel: config.aiModel,
        currency: config.currency,
        paystackKeys: config.paystackKeys,
        flutterwaveKeys: config.flutterwaveKeys,
        stripeKeys: config.stripeKeys,
        bankDetails: config.bankDetails,
        googleClientId: config.googleClientId,
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-cyan-500/10 flex flex-col sticky top-0 h-screen bg-black/50 backdrop-blur-md">
        <div className="p-6 flex items-center gap-2 border-b border-cyan-500/10">
          <div className="w-8 h-8 bg-cyan-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(8,145,178,0.5)]">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold tracking-tighter text-xl scifi-glow-text">REPLIEXA</span>
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border flex-shrink-0"
            style={{
              color: plan.color,
              borderColor: `${plan.color}40`,
              backgroundColor: `${plan.color}15`,
            }}
          >
            {plan.name}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarItem
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Overview"
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />
          <SidebarItem
            icon={<Wallet className="w-5 h-5" />}
            label="Wallet"
            active={activeTab === 'wallet'}
            onClick={() => setActiveTab('wallet')}
          />
          <SidebarItem
            icon={<Package className="w-5 h-5" />}
            label="Products"
            active={activeTab === 'products'}
            onClick={() => setActiveTab('products')}
          />
          <SidebarItem
            icon={<Users className="w-5 h-5" />}
            label="Leads"
            active={activeTab === 'leads'}
            onClick={() => setActiveTab('leads')}
          />
          <SidebarItem
            icon={<BookOpen className="w-5 h-5" />}
            label="Bookings"
            active={activeTab === 'bookings'}
            onClick={() => setActiveTab('bookings')}
          />
          <SidebarItem
            icon={<MessageSquare className="w-5 h-5" />}
            label="Agent Config"
            active={activeTab === 'config'}
            onClick={() => setActiveTab('config')}
          />
          <SidebarItem
            icon={<CreditCard className="w-5 h-5" />}
            label="Payments"
            active={activeTab === 'payments'}
            onClick={() => setActiveTab('payments')}
          />
          <SidebarItem
            icon={<Globe className="w-5 h-5" />}
            label="Integrations"
            active={activeTab === 'integrations'}
            onClick={() => setActiveTab('integrations')}
          />
          <SidebarItem
            icon={<Share2 className="w-5 h-5" />}
            label="Share & Embed"
            active={activeTab === 'share'}
            onClick={() => setActiveTab('share')}
          />
          <SidebarItem
            icon={<Crown className="w-5 h-5" />}
            label="Upgrade"
            active={activeTab === 'upgrade'}
            onClick={() => setActiveTab('upgrade')}
            highlight
          />

          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-white/10">
              <p className="px-4 mb-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                Admin Control
              </p>
              <SidebarItem
                icon={<ShieldCheck className="w-5 h-5" />}
                label="Admin Panel"
                active={activeTab === 'admin'}
                onClick={() => setActiveTab('admin')}
              />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <SidebarItem
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 scifi-grid relative">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

        {/* Announcement Banner */}
        <AnimatePresence>
          {announcement && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 px-6 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between relative z-10"
            >
              <p className="text-xs text-amber-300 font-mono">{announcement}</p>
              <button
                onClick={() => setAnnouncement(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white ml-4"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="flex items-center justify-between mb-12 relative z-10">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter scifi-glow-text">
              {activeTab.replace('-', ' ')}
            </h1>
            <p className="text-white/40 font-mono text-xs uppercase tracking-widest mt-1">
              System Status: <span className="text-green-500">Operational</span> // User:{' '}
              {user?.firstName || 'Business Owner'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={cn(
                'px-6 py-2 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg border',
                saveStatus === 'saved'
                  ? 'bg-green-600 border-green-400/50 shadow-green-600/20'
                  : saveStatus === 'error'
                  ? 'bg-red-600 border-red-400/50'
                  : 'bg-cyan-600 hover:bg-cyan-700 border-cyan-400/50 shadow-cyan-600/20',
              )}
            >
              {saveStatus === 'saving' ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : saveStatus === 'saved' ? (
                <CheckCircle className="w-4 h-4" />
              ) : saveStatus === 'error' ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                ? 'Saved!'
                : saveStatus === 'error'
                ? 'Failed'
                : 'Sync Data'}
            </button>
            <button className="px-4 py-2 bg-white/5 border border-cyan-500/20 rounded-lg text-sm font-medium hover:bg-cyan-500/10 transition-colors font-mono uppercase tracking-widest text-[10px]">
              Live Preview
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Onboarding Banner */}
        {!isOnboarded && activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl relative z-10"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-cyan-400 text-sm uppercase tracking-widest">
                  Complete Your Setup
                </h3>
                <p className="text-white/50 text-xs mt-1">
                  Your AI agent isn't ready yet. Complete these steps to go live:
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {[
                    { label: 'Add business name', done: config.name !== 'New Business', tab: 'config' },
                    { label: 'Add a product', done: config.products.length > 0, tab: 'products' },
                    {
                      label: 'Set up payments',
                      done: config.paymentMethod !== 'manual' || !!config.bankDetails?.accountNumber,
                      tab: 'payments',
                    },
                  ].map((step) => (
                    <button
                      key={step.label}
                      onClick={() => !step.done && setActiveTab(step.tab)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all',
                        step.done
                          ? 'bg-green-500/10 border-green-500/20 text-green-400 cursor-default'
                          : 'bg-white/5 border-white/10 text-white/40 hover:border-cyan-500/30 hover:text-cyan-400',
                      )}
                    >
                      {step.done ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-current" />
                      )}
                      {step.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab Routing */}
        {activeTab === 'overview' && <OverviewTab userId={user?.id} config={config} />}
        {activeTab === 'wallet' && <WalletTab userId={user?.id} />}
        {activeTab === 'products' && <ProductsTab config={config} setConfig={setConfig} />}
        {activeTab === 'leads' && <LeadsTab />}
        {activeTab === 'bookings' && <BookingsTab />}
        {activeTab === 'config' && <AgentConfigTab config={config} setConfig={setConfig} />}
        {activeTab === 'payments' && <PaymentsTab config={config} setConfig={setConfig} />}
        {activeTab === 'integrations' && <IntegrationsTab config={config} setConfig={setConfig} />}
        {activeTab === 'share' && <ShareTab config={config} />}
        {activeTab === 'upgrade' && (
          <UpgradeTab currentPlan={config.plan} userId={user?.id} setConfig={setConfig} config={config} />
        )}
        {activeTab === 'admin' && <AdminTab />}
      </main>
    </div>
  );
}
