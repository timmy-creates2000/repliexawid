import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  CreditCard,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  Zap,
  Globe,
  Wallet,
  ShieldCheck,
  BookOpen,
  ExternalLink,
  Banknote,
  Megaphone,
  Share2,
  Code,
  Link as LinkIcon,
  Palette,
  Layout as LayoutIcon,
  Database,
  Cloud,
  Key,
  Mail,
  Video
} from 'lucide-react';
import { cn } from '../lib/utils';
import { BusinessConfig } from '../lib/gemini';

export default function Dashboard({ config, setConfig }: { config: BusinessConfig, setConfig: React.Dispatch<React.SetStateAction<BusinessConfig>> }) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user is admin (mock check for now)
  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'adeniyigideon56@gmail.com';

  const handleSave = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: config.name,
          description: config.description,
          negotiationMode: config.negotiationMode,
          brandColor: config.brandColor,
          widgetPosition: config.widgetPosition,
          paymentMethod: config.paymentMethod,
          bankName: config.bankDetails?.bankName,
          accountNumber: config.bankDetails?.accountNumber,
          flutterwavePublicKey: config.flutterwaveKeys?.publicKey,
          flutterwaveSecretKey: config.flutterwaveKeys?.secretKey,
          paystackPublicKey: config.paystackKeys?.publicKey,
          paystackSecretKey: config.paystackKeys?.secretKey,
          googleClientId: config.googleClientId,
          composerIp: config.composerIp,
          composerApiKey: config.composerApiKey,
        })
      });
      if (response.ok) {
        console.log("Configuration saved successfully!");
      } else {
        console.error("Failed to save configuration.");
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-cyan-500/10 flex flex-col sticky top-0 h-screen bg-black/50 backdrop-blur-md">
        <div className="p-6 flex items-center gap-2 border-b border-cyan-500/10">
          <div className="w-8 h-8 bg-cyan-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(8,145,178,0.5)]">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-tighter text-xl scifi-glow-text">REPLIEXA</span>
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
            icon={<BookOpen className="w-5 h-5" />} 
            label="Learn" 
            active={activeTab === 'learn'} 
            onClick={() => setActiveTab('learn')} 
          />
          
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-white/10">
              <p className="px-4 mb-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">Admin Control</p>
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
        
        <header className="flex items-center justify-between mb-12 relative z-10">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter scifi-glow-text">{activeTab.replace('-', ' ')}</h1>
            <p className="text-white/40 font-mono text-xs uppercase tracking-widest mt-1">System Status: <span className="text-green-500">Operational</span> // User: {user?.firstName || 'Business Owner'}</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-cyan-600/20 border border-cyan-400/50"
            >
              <Save className="w-4 h-4" />
              Sync Data
            </button>
            <button className="px-4 py-2 bg-white/5 border border-cyan-500/20 rounded-lg text-sm font-medium hover:bg-cyan-500/10 transition-colors font-mono uppercase tracking-widest text-[10px]">
              Live Preview
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {activeTab === 'overview' && <OverviewTab userId={user?.id} />}
        {activeTab === 'wallet' && <WalletTab userId={user?.id} />}
        {activeTab === 'products' && <ProductsTab config={config} setConfig={setConfig} />}
        {activeTab === 'config' && <ConfigTab config={config} setConfig={setConfig} />}
        {activeTab === 'payments' && <PaymentsTab config={config} setConfig={setConfig} />}
        {activeTab === 'leads' && <LeadsTab />}
        {activeTab === 'integrations' && <IntegrationsTab config={config} setConfig={setConfig} />}
        {activeTab === 'share' && <ShareTab config={config} />}
        {activeTab === 'learn' && <LearnTab />}
        {activeTab === 'admin' && <AdminTab />}
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden",
        active ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30" : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]" />}
      <div className={cn("transition-colors", active ? "text-cyan-400" : "group-hover:text-cyan-400")}>
        {icon}
      </div>
      <span className="uppercase tracking-widest text-[10px] font-bold">{label}</span>
    </button>
  );
}

function StatCard({ title, value, change }: { title: string, value: string, change: string }) {
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

function OverviewTab({ userId }: { userId?: string }) {
  const [stats, setStats] = useState({ totalSales: 0, leadsCount: 0, conversionRate: 0 });

  const fetchStats = () => {
    if (userId) {
      fetch(`/api/stats/${userId}`)
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(err => console.error("Stats fetch error:", err));
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const simulateSale = async () => {
    if (!userId) return;
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        amount: 5000 + Math.floor(Math.random() * 10000),
        method: 'paystack',
        status: 'success'
      })
    });
    fetchStats();
  };

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

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">New Lead: John Doe</p>
                  <p className="text-xs text-white/40">Interested in E-book: Sales Mastery</p>
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

function WalletTab({ userId }: { userId?: string }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const totalBalance = transactions.reduce((acc, curr) => curr.status === 'success' ? acc + curr.amount : acc, 0);

  useEffect(() => {
    if (userId) {
      fetch(`/api/transactions/${userId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setTransactions(data);
        })
        .catch(err => console.error("Transactions fetch error:", err));
    }
  }, [userId]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-cyan-600 rounded-3xl space-y-4 shadow-2xl shadow-cyan-600/20 border border-cyan-400/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] font-mono">Total Balance</p>
          <h2 className="text-5xl font-black scifi-glow-text">₦{totalBalance.toLocaleString()}</h2>
          <button className="w-full py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-cyan-50 transition-all relative z-10">
            Withdraw Funds
          </button>
        </div>
        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-4">
          <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Pending (Escrow)</p>
          <h2 className="text-4xl font-bold">₦0</h2>
          <p className="text-xs text-white/40">Released after delivery confirmation.</p>
        </div>
        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-4">
          <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Total Withdrawn</p>
          <h2 className="text-4xl font-bold text-white/60">₦0</h2>
          <p className="text-xs text-white/40">Lifetime earnings processed.</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="font-bold">Recent Transactions</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Reference</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Amount</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Method</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Status</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.map((trx) => (
              <tr key={trx.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-white/60">{trx.reference}</td>
                <td className="px-6 py-4 font-bold">₦{trx.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-white/40 uppercase text-[10px]">{trx.method}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                    trx.status === 'success' ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                  )}>{trx.status}</span>
                </td>
                <td className="px-6 py-4 text-white/40">{new Date(trx.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-white/20 font-mono text-xs uppercase tracking-widest italic">No neural transactions detected.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsTab({ config, setConfig }: { config: BusinessConfig, setConfig: React.Dispatch<React.SetStateAction<BusinessConfig>> }) {
  const { user } = useUser();
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', lastPrice: '', type: 'digital' as const, description: '' });

  useEffect(() => {
    if (user) {
      fetch(`/api/products/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setConfig(prev => ({ ...prev, products: data }));
          }
        });
    }
  }, [user]);

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || !user) return;
    const product = { 
      id: Date.now().toString(),
      userId: user.id,
      name: newProduct.name,
      price: Number(newProduct.price), 
      lastPrice: Number(newProduct.lastPrice),
      type: newProduct.type,
      description: newProduct.description
    };

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (response.ok) {
        setConfig(prev => ({ ...prev, products: [...prev.products, product] }));
        setNewProduct({ name: '', price: '', lastPrice: '', type: 'digital', description: '' });
        setIsAdding(false);
      }
    } catch (error) {
      console.error("Failed to add product:", error);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setConfig(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your Products</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] border border-cyan-400/50"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <input 
              placeholder="Product Name" 
              className="bg-black/40 border border-cyan-500/20 rounded-lg p-3 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
            />
            <select 
              className="bg-black/40 border border-cyan-500/20 rounded-lg p-3 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
              value={newProduct.type}
              onChange={(e) => setNewProduct({...newProduct, type: e.target.value as any})}
            >
              <option value="digital">Digital Product</option>
              <option value="service">Service/Booking</option>
              <option value="physical">Physical Item</option>
            </select>
          </div>
          <textarea 
            placeholder="Product Description" 
            className="w-full bg-black/40 border border-cyan-500/20 rounded-lg p-3 text-xs font-mono outline-none focus:border-cyan-500 h-24 transition-all"
            value={newProduct.description}
            onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="number" 
              placeholder="Original Price" 
              className="bg-black/40 border border-cyan-500/20 rounded-lg p-3 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
              value={newProduct.price}
              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
            />
            <input 
              type="number" 
              placeholder="Last Price (Min)" 
              className="bg-black/40 border border-cyan-500/20 rounded-lg p-3 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
              value={newProduct.lastPrice}
              onChange={(e) => setNewProduct({...newProduct, lastPrice: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white">Cancel</button>
            <button onClick={addProduct} className="px-6 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] border border-cyan-400/50">Save Product</button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {config.products.map((p) => (
          <div key={p.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group">
            <div>
              <h4 className="font-bold text-lg">{p.name}</h4>
              <p className="text-sm text-white/40 uppercase tracking-widest">{p.type}</p>
              <div className="mt-4 flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-white/40 uppercase">Price</p>
                  <p className="font-bold">₦{p.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase">Min Price</p>
                  <p className="font-bold text-cyan-400 scifi-glow-text">₦{p.lastPrice.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => deleteProduct(p.id)}
              className="p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadsTab() {
  const { user } = useUser();
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetch(`/api/leads/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setLeads(data);
          }
        });
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your Leads</h2>
        <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
          Export CSV
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Name</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Product</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Status</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Date</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-xs text-white/40">{lead.email}</p>
                </td>
                <td className="px-6 py-4 text-white/60">{lead.product}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                    lead.status === 'converted' ? "bg-green-500/20 text-green-500" :
                    lead.status === 'negotiating' ? "bg-cyan-500/20 text-cyan-400" :
                    "bg-cyan-500/10 text-cyan-500/60"
                  )}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-white/40">{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : lead.date}</td>
                <td className="px-6 py-4">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConfigTab({ config, setConfig }: { config: BusinessConfig, setConfig: React.Dispatch<React.SetStateAction<BusinessConfig>> }) {
  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-4">
        <label className="text-sm font-bold text-white/60">Business Description</label>
        <textarea 
          placeholder="Tell the AI about your business, what you do, and how you want to be represented..."
          className="w-full h-40 bg-black/40 border border-cyan-500/20 rounded-2xl p-6 text-xs font-mono outline-none focus:border-cyan-500 transition-all placeholder:text-white/20"
          value={config.description}
          onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl">
        <div>
          <h4 className="font-bold">Brand Color</h4>
          <p className="text-sm text-white/40">Customize the widget color to match your brand.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="color" 
            value={config.brandColor}
            onChange={(e) => setConfig(prev => ({ ...prev, brandColor: e.target.value }))}
            className="w-10 h-10 bg-transparent border-none cursor-pointer"
          />
          <span className="text-xs font-mono text-white/60 uppercase">{config.brandColor}</span>
        </div>
      </div>

      <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl">
        <div>
          <h4 className="font-bold">Widget Position</h4>
          <p className="text-sm text-white/40">Where should the chat bubble appear?</p>
        </div>
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setConfig(prev => ({ ...prev, widgetPosition: 'bottom-left' }))}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all",
              config.widgetPosition === 'bottom-left' ? "bg-white text-black" : "text-white/40 hover:text-white"
            )}
          >
            Left
          </button>
          <button 
            onClick={() => setConfig(prev => ({ ...prev, widgetPosition: 'bottom-right' }))}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all",
              config.widgetPosition === 'bottom-right' ? "bg-white text-black" : "text-white/40 hover:text-white"
            )}
          >
            Right
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl">
        <div>
          <h4 className="font-bold">Negotiation Mode</h4>
          <p className="text-sm text-white/40">Allow AI to negotiate prices down to your minimum.</p>
        </div>
        <div 
          onClick={() => setConfig(prev => ({ ...prev, negotiationMode: !prev.negotiationMode }))}
          className={cn(
            "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
            config.negotiationMode ? "bg-cyan-600" : "bg-white/10"
          )}
        >
          <motion.div 
            animate={{ x: config.negotiationMode ? 24 : 4 }}
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl">
        <div>
          <h4 className="font-bold">Voice Chat</h4>
          <p className="text-sm text-white/40">Enable real-time voice conversations.</p>
        </div>
        <div className="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer opacity-50">
          <div className="absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full" />
        </div>
      </div>

      <button className="w-full py-4 bg-cyan-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] border border-cyan-400/50 uppercase tracking-widest text-xs">
        <Save className="w-5 h-5" /> Save Configuration
      </button>
    </div>
  );
}

function PaymentsTab({ config, setConfig }: { config: BusinessConfig, setConfig: React.Dispatch<React.SetStateAction<BusinessConfig>> }) {
  const method = config.paymentMethod;
  const setMethod = (m: 'flutterwave' | 'paystack' | 'manual') => setConfig(prev => ({ ...prev, paymentMethod: m }));

  return (
    <div className="max-w-4xl space-y-8">
      <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
        <h3 className="text-xl font-bold">Customer Payment Methods</h3>
        <p className="text-sm text-white/40">
          Choose how your customers pay you. You can enable multiple methods.
        </p>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setMethod('flutterwave')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-bold border transition-all uppercase tracking-widest",
              method === 'flutterwave' ? "bg-cyan-600 border-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]" : "bg-white/5 border-white/10 text-white/40"
            )}
          >
            Flutterwave
          </button>
          <button 
            onClick={() => setMethod('paystack')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-bold border transition-all uppercase tracking-widest",
              method === 'paystack' ? "bg-cyan-600/40 border-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.3)]" : "bg-white/5 border-white/10 text-white/40"
            )}
          >
            Paystack
          </button>
          <button 
            onClick={() => setMethod('manual')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-bold border transition-all uppercase tracking-widest",
              method === 'manual' ? "bg-cyan-900/40 border-cyan-500 text-white" : "bg-white/5 border-white/10 text-white/40"
            )}
          >
            Manual Transfer
          </button>
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
                    onChange={(e) => setConfig(prev => ({ ...prev, flutterwaveKeys: { ...(prev.flutterwaveKeys || { secretKey: '' }), publicKey: e.target.value } }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Secret Key</label>
                  <input 
                    type="password" 
                    placeholder="FLWSECK_..." 
                    className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-4 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
                    value={config.flutterwaveKeys?.secretKey || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, flutterwaveKeys: { ...(prev.flutterwaveKeys || { publicKey: '' }), secretKey: e.target.value } }))}
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
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-blue-500"
                    value={config.paystackKeys?.publicKey || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, paystackKeys: { ...(prev.paystackKeys || { secretKey: '' }), publicKey: e.target.value } }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Secret Key</label>
                  <input 
                    type="password" 
                    placeholder="sk_test_..." 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-blue-500"
                    value={config.paystackKeys?.secretKey || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, paystackKeys: { ...(prev.paystackKeys || { publicKey: '' }), secretKey: e.target.value } }))}
                  />
                </div>
              </div>
              <p className="text-xs text-white/40">Highly recommended for Nigerian businesses. Fast setup and reliable.</p>
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
                    onChange={(e) => setConfig(prev => ({ ...prev, bankDetails: { ...prev.bankDetails!, bankName: e.target.value } }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Account Number</label>
                  <input 
                    placeholder="0123456789" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-green-500"
                    value={config.bankDetails?.accountNumber || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, bankDetails: { ...prev.bankDetails!, accountNumber: e.target.value } }))}
                  />
                </div>
              </div>
              <p className="text-xs text-white/40">AI will provide these details to customers. You must manually confirm payments.</p>
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
            <span className="px-3 py-1 bg-cyan-600/20 text-cyan-400 text-[10px] font-bold rounded-full uppercase tracking-widest border border-cyan-500/30">Free Trial</span>
          </div>
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Your Repliexa AI subscription status.</p>
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

function IntegrationsTab({ config, setConfig }: { config: BusinessConfig, setConfig: React.Dispatch<React.SetStateAction<BusinessConfig>> }) {
  return (
    <div className="max-w-4xl space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Drive */}
        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Google Drive</h3>
            <p className="text-sm text-white/40 mt-1">Connect your Drive to let AI access your documents and spreadsheets.</p>
          </div>
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Client ID</label>
              <input 
                type="password" 
                placeholder="Enter Google Client ID" 
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500" 
                value={config.googleClientId || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, googleClientId: e.target.value }))}
              />
            </div>
            <button className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-all">
              {config.googleClientId ? 'Update Google Account' : 'Connect Google Account'}
            </button>
          </div>
        </div>

        {/* Composer Integration */}
        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Composer Automation</h3>
            <p className="text-sm text-white/40 mt-1">Link your self-hosted Composer instance for advanced workflows.</p>
          </div>
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Composer IP Address</label>
              <input 
                placeholder="e.g. 192.168.1.100" 
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-purple-500" 
                value={config.composerIp || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, composerIp: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">API Key</label>
              <input 
                type="password" 
                placeholder="Enter Composer API Key" 
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-purple-500" 
                value={config.composerApiKey || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, composerApiKey: e.target.value }))}
              />
            </div>
            <button className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-500 transition-all">
              Link Composer
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
        <h3 className="text-xl font-bold">Standard Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Google Sheets', status: 'Connected', icon: <Database className="w-5 h-5" /> },
            { name: 'Google Meet', status: 'Not Connected', icon: <Video className="w-5 h-5" /> },
            { name: 'Email (Resend)', status: 'Connected', icon: <Mail className="w-5 h-5" /> },
            { name: 'Telegram Bot', status: 'Not Connected', icon: <Megaphone className="w-5 h-5" /> },
          ].map((s) => (
            <div key={s.name} className="p-6 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/60">
                  {s.icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{s.name}</h4>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest", s.status === 'Connected' ? "text-green-500" : "text-white/20")}>
                    {s.status}
                  </p>
                </div>
              </div>
              <button className="text-xs font-bold text-white/40 hover:text-white transition-colors">
                {s.status === 'Connected' ? 'Manage' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
        <h3 className="text-xl font-bold">Webhooks (Make/Zapier Alternative)</h3>
        <p className="text-sm text-white/40">
          Since you prefer not to use paid tools like Zapier, you can use our built-in webhook system to trigger any external service.
        </p>
        <div className="flex items-center gap-4 p-4 bg-black/40 border border-cyan-500/20 rounded-2xl">
          <code className="text-[10px] text-cyan-400 font-mono flex-1 overflow-hidden text-ellipsis">
            {window.location.origin}/api/webhooks/custom
          </code>
          <button 
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/custom`)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareTab({ config }: { config: BusinessConfig }) {
  const businessId = config.name.toLowerCase().replace(/\s+/g, '-');
  const standaloneUrl = `${window.location.origin}/b/${businessId}`;
  const embedCode = `<script src="${window.location.origin}/widget.js" data-business="${businessId}"></script>`;

  return (
    <div className="max-w-4xl space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Standalone Link */}
        <div className="p-8 bg-white/5 border border-cyan-500/10 rounded-3xl space-y-6 scifi-border scifi-border-hover">
          <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Business Landing Page</h3>
            <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-mono">A dedicated page for your business where customers can chat directly.</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-black/40 border border-cyan-500/20 rounded-xl">
            <code className="text-[10px] text-cyan-400/60 font-mono flex-1 overflow-hidden text-ellipsis">{standaloneUrl}</code>
            <button 
              onClick={() => navigator.clipboard.writeText(standaloneUrl)}
              className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors text-white/40 hover:text-cyan-400"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>
          <a 
            href={standaloneUrl} 
            target="_blank" 
            rel="noreferrer"
            className="block w-full py-3 bg-cyan-600 text-white text-center rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] border border-cyan-400/50"
          >
            Preview Landing Page
          </a>
        </div>

        {/* Embed Code */}
        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
          <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Embed on Website</h3>
            <p className="text-sm text-white/40 mt-1">Add the AI agent to Wix, WordPress, Shopify, or any custom site.</p>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
              <pre className="text-[10px] text-white/60 overflow-x-auto whitespace-pre-wrap">
                {embedCode}
              </pre>
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(embedCode)}
              className="w-full py-3 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all border border-white/10"
            >
              Copy Embed Code
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-4">
        <h4 className="font-bold">Platform Guides</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['WordPress', 'Wix', 'Shopify', 'Custom HTML'].map(platform => (
            <div key={platform} className="p-4 bg-black/20 border border-white/5 rounded-2xl text-center">
              <p className="text-xs font-bold text-white/60">{platform}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({ title, description, icon, connected }: { title: string, description: string, icon: React.ReactNode, connected: boolean }) {
  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between gap-6">
      <div className="flex items-start justify-between">
        {icon}
        <span className={cn(
          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
          connected ? "bg-green-500/20 text-green-500" : "bg-white/10 text-white/40"
        )}>
          {connected ? 'Connected' : 'Not Connected'}
        </span>
      </div>
      <div>
        <h4 className="font-bold mb-1">{title}</h4>
        <p className="text-xs text-white/40 leading-relaxed">{description}</p>
      </div>
      <button className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors">
        {connected ? 'Configure' : 'Connect'}
      </button>
    </div>
  );
}

function LearnTab() {
  return (
    <div className="max-w-4xl space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 bg-white/5 border border-cyan-500/10 rounded-3xl space-y-4 scifi-border scifi-border-hover">
          <div className="w-12 h-12 bg-cyan-600/20 rounded-2xl flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">Getting Started</h3>
          <p className="text-xs text-white/40 leading-relaxed font-mono uppercase tracking-widest">
            Learn how to set up your first AI agent, add products, and start making sales in under 5 minutes.
          </p>
          <button className="flex items-center gap-2 text-cyan-400 font-bold text-[10px] uppercase tracking-widest hover:underline">
            Read Guide <ExternalLink className="w-4 h-4" />
          </button>
        </div>
        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-4">
          <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">Payment Setup</h3>
          <p className="text-sm text-white/40 leading-relaxed">
            Understand the difference between Flutterwave, Paystack, and Manual payments for your customers.
          </p>
          <button className="flex items-center gap-2 text-blue-500 font-bold text-sm hover:underline">
            Watch Tutorial <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-8 bg-white/5 border border-white/10 rounded-3xl">
        <h3 className="text-xl font-bold mb-6 text-center">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <FaqItem 
            question="Why should I use Paystack instead of Flutterwave?" 
            answer="Paystack is often preferred for its seamless integration and high success rates in Nigeria. If you don't have a registered business yet, Paystack's 'Starter' account is easier to set up than Flutterwave's full business verification."
          />
          <FaqItem 
            question="How do manual payments work?" 
            answer="With manual payments, the AI provides your bank details to the customer. Once they pay, they upload a receipt, and you must manually confirm the payment in your dashboard to release the product."
          />
          <FaqItem 
            question="Is my data secure?" 
            answer="Yes. We use industry-standard encryption and never store your secret keys. All payments are processed directly through the gateways."
          />
        </div>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
      >
        <span className="font-bold text-sm">{question}</span>
        <ChevronRight className={cn("w-5 h-5 transition-transform", isOpen && "rotate-90")} />
      </button>
      {isOpen && (
        <div className="p-6 bg-black/40 text-sm text-white/40 leading-relaxed border-t border-white/10">
          {answer}
        </div>
      )}
    </div>
  );
}

function AdminTab() {
  const [ads, setAds] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/ads')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAds(data);
        }
      });
  }, []);

  return (
    <div className="max-w-5xl space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-xs text-white/40 uppercase font-bold tracking-widest mb-2">Total Users</p>
          <h4 className="text-2xl font-bold">1,284</h4>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-xs text-white/40 uppercase font-bold tracking-widest mb-2">Total MRR</p>
          <h4 className="text-2xl font-bold">₦3.2M</h4>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-xs text-white/40 uppercase font-bold tracking-widest mb-2">Active Agents</p>
          <h4 className="text-2xl font-bold">842</h4>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-xs text-white/40 uppercase font-bold tracking-widest mb-2">Ad Revenue</p>
          <h4 className="text-2xl font-bold">₦450k</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-white/5 border border-cyan-500/10 rounded-3xl space-y-6 scifi-border scifi-border-hover">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold uppercase tracking-tighter italic">Sponsored Ads</h3>
            <button className="px-3 py-1 bg-cyan-600 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(8,145,178,0.3)]">New Ad</button>
          </div>
          <div className="space-y-4">
            {ads.map((ad) => (
              <div key={ad.id} className="p-4 bg-black/40 border border-cyan-500/10 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Megaphone className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest">{ad.title}</p>
                    <p className="text-[10px] text-cyan-400/40 font-mono">{ad.active ? 'Active' : 'Paused'}</p>
                  </div>
                </div>
                <button className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white">Edit</button>
              </div>
            ))}
            {ads.length === 0 && (
              <p className="text-center text-white/20 py-8 text-[10px] uppercase tracking-widest font-mono italic">No active nodes found.</p>
            )}
          </div>
        </div>

        <div className="p-8 bg-white/5 border border-cyan-500/10 rounded-3xl space-y-6 scifi-border scifi-border-hover">
          <h3 className="text-xl font-bold uppercase tracking-tighter italic">System Announcements</h3>
          <textarea 
            placeholder="Write an announcement to all users..."
            className="w-full h-32 bg-black/40 border border-cyan-500/20 rounded-xl p-4 text-xs font-mono outline-none focus:border-cyan-500 transition-all placeholder:text-white/20"
          />
          <button className="w-full py-3 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-cyan-50 transition-all">Broadcast Message</button>
        </div>
      </div>
    </div>
  );
}
