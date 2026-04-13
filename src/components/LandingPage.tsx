import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Zap, ShieldCheck, Cpu, Globe, MessageSquare, DollarSign, Activity, ChevronRight } from 'lucide-react';
import ChatWidget from './ChatWidget';
import type { BusinessConfig } from '../lib/types';

export default function LandingPage({ config }: { config: BusinessConfig }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white scifi-grid relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 border-b border-cyan-500/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter italic">Repliexa</span>
          </div>
          
          <div className="flex items-center gap-8">
            <Link to="/sign-in" className="text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-cyan-400 transition-colors font-mono">
              Access Terminal
            </Link>
            <Link to="/sign-up" className="px-5 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              Initialize Protocol
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,1)]" />
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">Neural Link Established</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-7xl font-black leading-none tracking-tighter uppercase italic">
                Meet <span className="scifi-glow-text" style={{ color: config.brandColor }}>{config.name}</span>
              </h1>
              <div className="h-1 w-24 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]" />
            </div>

            <p className="text-xl text-white/60 leading-relaxed font-light max-w-lg">
              {config.description || "Our advanced AI sales agent is ready to negotiate, facilitate transactions, and provide instant support for your digital ecosystem."}
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-cyan-500/30 bg-black flex items-center justify-center overflow-hidden scifi-border">
                    <img src={`https://picsum.photos/seed/cyber${i}/48/48`} alt="User" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-white font-bold uppercase tracking-widest font-mono">1,200+ Active Nodes</p>
                <p className="text-xs text-white/40 font-medium">Processing real-time negotiations</p>
              </div>
            </div>

            <div className="pt-8 flex flex-wrap gap-4">
              <Link to="/sign-up" className="inline-flex px-8 py-4 bg-cyan-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] border border-cyan-400/50 items-center gap-2 group">
                Initialize Protocol <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/sign-in" className="inline-flex px-8 py-4 bg-white/5 text-white/60 border border-white/10 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white/10 hover:text-white transition-all items-center gap-2">
                Access Terminal
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-[750px] w-full relative group"
          >
            <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full group-hover:bg-cyan-500/20 transition-all duration-700" />
            <div className="relative h-full scifi-border rounded-3xl overflow-hidden bg-black/40 backdrop-blur-sm">
              <ChatWidget config={config} fullPage={true} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 relative z-10 bg-black/20">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">Core Capabilities</h2>
            <p className="text-white/40 font-mono text-xs uppercase tracking-[0.3em]">Advanced Sales Automation Modules</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Autonomous Negotiation",
                desc: "AI dynamically adjusts pricing based on user behavior and your predefined minimums.",
                icon: <Activity className="w-8 h-8 text-cyan-400" />
              },
              {
                title: "Neural Lead Capture",
                desc: "Every interaction is logged and analyzed to build comprehensive customer profiles.",
                icon: <Cpu className="w-8 h-8 text-cyan-400" />
              },
              {
                title: "Secure Transactions",
                desc: "Integrated payment gateways ensure every sale is verified and processed instantly.",
                icon: <ShieldCheck className="w-8 h-8 text-cyan-400" />
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 bg-white/5 border border-cyan-500/10 rounded-3xl space-y-6 scifi-border scifi-border-hover"
              >
                <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed font-mono">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      {config.products && config.products.length > 0 && (
        <section className="py-24 px-4 relative z-10">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Available Assets</h2>
                <p className="text-white/40 font-mono text-xs uppercase tracking-[0.3em]">Neural Marketplace Inventory</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono bg-cyan-500/5 px-4 py-2 rounded-full border border-cyan-500/20">
                <Activity className="w-3 h-3 animate-pulse" /> Live Inventory Sync
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {config.products.map((p, i) => (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative p-8 bg-white/5 border border-cyan-500/10 rounded-3xl space-y-6 overflow-hidden scifi-border"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap className="w-12 h-12 text-cyan-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">{p.type}</p>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">{p.name}</h3>
                  </div>
                  <p className="text-sm text-white/40 line-clamp-2 font-mono">{p.description}</p>
                  <div className="pt-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] text-white/20 uppercase font-bold">Starting At</p>
                      <p className="text-3xl font-black scifi-glow-text">₦{p.price.toLocaleString()}</p>
                    </div>
                    <button className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500 hover:text-white transition-all">
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust & Stats */}
      <section className="py-24 px-4 relative z-10 bg-cyan-500/5 border-y border-cyan-500/10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: "Uptime", value: "99.99%", icon: <Activity className="w-4 h-4" /> },
            { label: "Latency", value: "< 50ms", icon: <Zap className="w-4 h-4" /> },
            { label: "Encryption", value: "AES-256", icon: <ShieldCheck className="w-4 h-4" /> },
            { label: "Global Nodes", value: "12k+", icon: <Globe className="w-4 h-4" /> }
          ].map((s, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-cyan-400/40">
                {s.icon}
                <span className="text-[10px] font-bold uppercase tracking-widest font-mono">{s.label}</span>
              </div>
              <p className="text-4xl font-black italic tracking-tighter scifi-glow-text">{s.value}</p>
            </div>
          ))}
        </div>
      </section>
      
      <footer className="py-24 border-t border-cyan-500/10 w-full text-center relative z-10">
        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-12 text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] font-mono">
            <span className="hover:text-cyan-400 transition-colors cursor-pointer">Security Protocol</span>
            <span className="hover:text-cyan-400 transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-cyan-400 transition-colors cursor-pointer">Neural API</span>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-white/20 uppercase tracking-[0.5em] font-black">Repliexa // Neural Sales Interface</p>
            <p className="text-[10px] text-white/10 font-mono">© 2026 REPLIEXA CORP. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
