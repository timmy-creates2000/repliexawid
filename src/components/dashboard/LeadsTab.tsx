import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, ChevronDown } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';
import { Lead } from '../../lib/types';

export default function LeadsTab() {
  const { user } = useUser();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      api.leads
        .list()
        .then((data) => { if (Array.isArray(data)) setLeads(data); })
        .catch((err) => console.error('Leads fetch error:', err));
    }
  }, [user]);

  const filtered = leads.filter((l) => {
    const matchSearch =
      !search ||
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statuses = ['all', 'new', 'negotiating', 'converted'];

  function getQualificationEntries(lead: Lead): [string, string][] {
    const data = lead.qualificationData;
    if (!data || typeof data !== 'object') return [];
    return Object.entries(data).filter(([, v]) => v !== '' && v != null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold">Your Leads</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-cyan-500 transition-all w-48"
            />
          </div>
          <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
            {statuses.map((s) => (
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
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors uppercase tracking-widest">
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Name</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Email</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Phone</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Status</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Date</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((lead) => {
              const qualEntries = getQualificationEntries(lead);
              const isExpanded = expandedId === lead.id;
              return (
                <React.Fragment key={lead.id}>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{lead.name}</td>
                    <td className="px-6 py-4 text-xs text-white/40 font-mono">{lead.email}</td>
                    <td className="px-6 py-4 text-xs text-white/40 font-mono">{lead.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest',
                          lead.status === 'converted'
                            ? 'bg-green-500/20 text-green-500'
                            : lead.status === 'negotiating'
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-white/10 text-white/40',
                        )}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/40 text-xs">
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        disabled={qualEntries.length === 0}
                      >
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4 text-cyan-400" />
                          : <ChevronRight className={cn('w-4 h-4', qualEntries.length > 0 ? 'text-white/40' : 'text-white/10')} />
                        }
                      </button>
                    </td>
                  </tr>
                  {isExpanded && qualEntries.length > 0 && (
                    <tr className="bg-black/20">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {qualEntries.map(([key, value]) => (
                            <div key={key} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                              <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono mb-1">
                                {key.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs font-medium text-white/80">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-white/20 font-mono text-xs uppercase tracking-widest italic">
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
