import React, { useState } from 'react';
import { Globe, Lock, Link as LinkIcon, Copy, MessageSquare, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BusinessConfig } from '../../lib/types';

interface Props {
  config: BusinessConfig;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors text-white/40 hover:text-cyan-400"
      title="Copy"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export default function ShareTab({ config }: Props) {
  const businessId = config.userId;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const standaloneUrl = `${origin}/b/${businessId}`;
  const chatUrl = `${origin}/chat/${businessId}`;
  const embedCode = `<script src="${origin}/widget.js" data-user-id="${businessId}"></script>`;
  const canEmbed = config.plan === 'pro' || config.plan === 'business';

  return (
    <div className="max-w-4xl space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Business Landing Page */}
        <div className="p-8 bg-white/5 border border-cyan-500/10 rounded-3xl space-y-6 scifi-border scifi-border-hover">
          <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Business Landing Page</h3>
            <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-mono">
              A dedicated page for your business where customers can chat directly.
            </p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-black/40 border border-cyan-500/20 rounded-xl">
            <code className="text-[10px] text-cyan-400/60 font-mono flex-1 overflow-hidden text-ellipsis">
              {standaloneUrl}
            </code>
            <CopyButton text={standaloneUrl} />
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

        {/* Direct Chat URL */}
        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Direct Chat URL</h3>
            <p className="text-sm text-white/40 mt-1">Share a direct link that opens the chat widget immediately.</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-black/40 border border-white/10 rounded-xl">
            <code className="text-[10px] text-white/40 font-mono flex-1 overflow-hidden text-ellipsis">
              {chatUrl}
            </code>
            <CopyButton text={chatUrl} />
          </div>
          <a
            href={chatUrl}
            target="_blank"
            rel="noreferrer"
            className="block w-full py-3 bg-white/10 text-white text-center rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10"
          >
            Open Chat
          </a>
        </div>
      </div>

      {/* Embed Code */}
      <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Embed on Website</h3>
            <p className="text-sm text-white/40 mt-1">
              Add the AI agent to Wix, WordPress, Shopify, or any custom site.
            </p>
          </div>
          {!canEmbed && (
            <span className="ml-auto flex items-center gap-1 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              <Lock className="w-3 h-3" /> Pro Required
            </span>
          )}
        </div>
        <div className={cn('space-y-4', !canEmbed && 'opacity-40 pointer-events-none select-none')}>
          <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
            <pre className="text-[10px] text-white/60 overflow-x-auto whitespace-pre-wrap">{embedCode}</pre>
          </div>
          <button
            onClick={() => canEmbed && navigator.clipboard.writeText(embedCode)}
            disabled={!canEmbed}
            className="w-full py-3 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all border border-white/10 disabled:cursor-not-allowed"
          >
            {canEmbed ? 'Copy Embed Code' : 'Upgrade to Pro to Embed'}
          </button>
        </div>
        {!canEmbed && (
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-center">
            <p className="text-xs text-amber-400 font-bold">Upgrade to Pro or Business to embed the widget on your website.</p>
          </div>
        )}
      </div>

      <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-4">
        <h4 className="font-bold">Platform Guides</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['WordPress', 'Wix', 'Shopify', 'Custom HTML'].map((platform) => (
            <div key={platform} className="p-4 bg-black/20 border border-white/5 rounded-2xl text-center">
              <p className="text-xs font-bold text-white/60">{platform}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
