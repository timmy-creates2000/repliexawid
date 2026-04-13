import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';
import { Transaction } from '../../lib/types';

interface Props {
  userId?: string;
}

export default function WalletTab({ userId }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const totalBalance = transactions.reduce(
    (acc, curr) => (curr.status === 'success' ? acc + curr.amount : acc),
    0,
  );

  useEffect(() => {
    if (userId) {
      api.transactions
        .list()
        .then((data) => {
          if (Array.isArray(data)) setTransactions(data);
        })
        .catch((err) => console.error('Transactions fetch error:', err));
    }
  }, [userId]);

  const filtered = transactions.filter((t) => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchSearch = !search || t.reference?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

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
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-4 flex-wrap">
          <h3 className="font-bold">Recent Transactions</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ref..."
                className="bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-cyan-500 w-40"
              />
            </div>
            <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
              {['all', 'success', 'failed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                    statusFilter === s ? 'bg-cyan-600 text-white' : 'text-white/30 hover:text-white',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
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
            {filtered.map((trx) => (
              <tr key={trx.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-white/60">{trx.reference}</td>
                <td className="px-6 py-4 font-bold">₦{trx.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-white/40 uppercase text-[10px]">{trx.method}</td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-[10px] font-bold uppercase',
                      trx.status === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500',
                    )}
                  >
                    {trx.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-white/40">
                  {new Date(trx.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-white/20 font-mono text-xs uppercase tracking-widest italic">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
