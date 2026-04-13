import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useUser } from '@clerk/clerk-react';
import { Cloud, CheckCircle, ExternalLink, Zap, MessageSquare, Calendar, Mail, Phone } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';
import type { BusinessConfig, Automation } from '../../lib/types';

interface Props {
  config: BusinessConfig;
  setConfig: React.Dispatch<React.SetStateAction<BusinessConfig>>;
}

// ─── Automation definitions ───────────────────────────────────────────────────

const AUTOMATION_DEFS = [
  {
    triggerEvent: 'lead_captured',
    actionType: 'send_whatsapp_notification',
    label: 'WhatsApp alert on new lead',
    description: 'Send yourself a WhatsApp message when a new lead is captured in chat.',
    icon: <Phone className="w-5 h-5" />,
    color: '#25d366',
    configField: { key: 'phoneNumber', label: 'Your WhatsApp number', placeholder: '+2348012345678' },
  },
  {
    triggerEvent: 'booking_confirmed',
    actionType: 'create_google_calendar_event',
    label: 'Google Calendar event on booking',
    description: 'Automatically create a Google Calendar event with a Meet link when a booking is confirmed.',
    icon: <Calendar className="w-5 h-5" />,
    color: '#4285f4',
    configField: null,
  },
  {
    triggerEvent: 'booking_confirmed',
    actionType: 'send_booking_confirmation_email',
    label: 'Email visitor on booking confirmation',
    description: 'Send the visitor a confirmation email with session details and Meet link.',
    icon: <Mail className="w-5 h-5" />,
    color: '#06b6d4',
    configField: null,
  },
  {
    triggerEvent: 'booking_confirmed',
    actionType: 'send_owner_booking_alert',
    label: 'Email yourself on new booking',
    description: 'Get an email alert when a visitor books a session.',
    icon: <Mail className="w-5 h-5" />,
    color: '#a855f7',
    configField: null,
  },
  {
    triggerEvent: 'payment_confirmed',
    actionType: 'send_email_receipt',
    label: 'Email receipt on payment',
    description: 'Send the customer a payment receipt after a successful transaction.',
    icon: <Mail className="w-5 h-5" />,
    color: '#22c55e',
    configField: null,
  },
];

// ─── Single Automation Row ────────────────────────────────────────────────────

function AutomationRow({
  def,
  automation,
  onToggle,
  onConfigSave,
}: {
  def: typeof AUTOMATION_DEFS[0];
  automation: Automation | undefined;
  onToggle: (id: string | undefined, triggerEvent: string, actionType: string, enabled: boolean) => void;
  onConfigSave: (id: string, configJson: Record<string, any>) => void;
}) {
  const isEnabled = automation?.isEnabled ?? false;
  const [configValue, setConfigValue] = useState(
    automation?.configJson?.[def.configField?.key ?? ''] ?? ''
  );
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${def.color}20`, color: def.color }}>
            {def.icon}
          </div>
          <div>
            <p className="text-sm font-bold">{def.label}</p>
            <p className="text-xs text-white/40 mt-0.5">{def.description}</p>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 inline-block" style={{ backgroundColor: `${def.color}15`, color: def.color }}>
              {def.triggerEvent.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div
          onClick={() => onToggle(automation?.id, def.triggerEvent, def.actionType, !isEnabled)}
          className={cn('w-12 h-6 rounded-full relative cursor-pointer transition-colors flex-shrink-0 mt-1', isEnabled ? 'bg-cyan-500' : 'bg-white/10')}
        >
          <motion.div animate={{ x: isEnabled ? 24 : 2 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow" />
        </div>
      </div>

      {/* Config field (e.g. WhatsApp number) */}
      {def.configField && isEnabled && (
        <div className="flex items-center gap-2 pt-1">
          <input
            placeholder={def.configField.placeholder}
            value={configValue}
            onChange={e => setConfigValue(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-cyan-500 transition-all"
          />
          <button
            onClick={() => automation?.id && onConfigSave(automation.id, { [def.configField!.key]: configValue })}
            className="px-3 py-2 bg-cyan-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-500 transition-all"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Google Connect Section ───────────────────────────────────────────────────

function GoogleConnectSection({ config }: { config: BusinessConfig }) {
  const isConnected = !!config.googleAccessToken;

  const handleConnect = async () => {
    try {
      const { authUrl } = await api.google.getAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      console.error('Failed to get Google auth URL:', err);
    }
  };

  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
          <Cloud className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Google Calendar & Meet</h3>
          <p className="text-xs text-white/40">Auto-create calendar events with Meet links on booking confirmation.</p>
        </div>
        {isConnected && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-green-400 uppercase tracking-widest">
            <CheckCircle className="w-3 h-3" /> Connected
          </span>
        )}
      </div>
      {!isConnected ? (
        <button
          onClick={handleConnect}
          className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" /> Connect Google Account
        </button>
      ) : (
        <p className="text-[10px] text-white/30 font-mono">Google account connected. Calendar events will be created automatically on booking confirmation.</p>
      )}
    </div>
  );
}

// ─── Main IntegrationsTab ─────────────────────────────────────────────────────

export default function IntegrationsTab({ config, setConfig }: Props) {
  const { user } = useUser();
  const [automations, setAutomations] = useState<Automation[]>([]);

  useEffect(() => {
    api.automations.list()
      .then(data => setAutomations(data as Automation[]))
      .catch(console.error);
  }, []);

  // Check for Google connected redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google') === 'connected') {
      setConfig(prev => ({ ...prev, googleAccessToken: 'connected' }));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleToggle = async (
    id: string | undefined,
    triggerEvent: string,
    actionType: string,
    enabled: boolean
  ) => {
    if (id) {
      await api.automations.toggle(id, enabled);
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, isEnabled: enabled } : a));
    } else {
      // Create new automation
      await api.automations.save({ triggerEvent: triggerEvent as any, actionType, isEnabled: enabled, configJson: {} });
      const updated = await api.automations.list();
      setAutomations(updated as Automation[]);
    }
  };

  const handleConfigSave = async (id: string, configJson: Record<string, any>) => {
    await api.automations.toggle(id, true);
    // Update config via patch
    await fetch(`/api/automations?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configJson }),
    });
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, configJson } : a));
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Google Connect */}
      <GoogleConnectSection config={config} />

      {/* Automations */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-sm uppercase tracking-widest">Automations</h3>
        </div>
        <p className="text-xs text-white/40">Toggle automations to run automatically when events happen in your widget.</p>
        <div className="space-y-3">
          {AUTOMATION_DEFS.map(def => {
            const existing = automations.find(
              a => a.triggerEvent === def.triggerEvent && a.actionType === def.actionType
            );
            return (
              <AutomationRow
                key={`${def.triggerEvent}-${def.actionType}`}
                def={def}
                automation={existing}
                onToggle={handleToggle}
                onConfigSave={handleConfigSave}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
