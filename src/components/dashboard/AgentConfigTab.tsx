import React, { useState, useEffect } from 'react';
import { Save, Lock, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { BusinessConfig, QualificationQuestion, WidgetBgStyle, WidgetBorderRadius } from '../../lib/types';
import { getPlan } from '../../lib/plans';
import { api } from '../../services/api';

interface Props {
  config: BusinessConfig;
  setConfig: React.Dispatch<React.SetStateAction<BusinessConfig>>;
  onSave?: () => void;
}

const AI_MODELS = [
  { id: 'gemini' as const, label: 'Gemini 2.0 Flash', desc: 'Fast, smart, great for most businesses.', free: true },
  { id: 'openai' as const, label: 'GPT-4o Mini', desc: 'Best conversational quality. Highly persuasive.', free: false },
  { id: 'grok' as const, label: 'Grok 3 Mini', desc: 'Fast responses, great for real-time chat.', free: false },
] as const;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export default function AgentConfigTab({ config, setConfig, onSave }: Props) {
  const plan = getPlan(config.plan);

  // Qualification questions state
  const [questions, setQuestions] = useState<QualificationQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newRequired, setNewRequired] = useState(true);
  const [qLoading, setQLoading] = useState(false);

  useEffect(() => {
    if (config.userId) {
      api.qualificationQuestions.list(config.userId)
        .then((data) => { if (Array.isArray(data)) setQuestions(data); })
        .catch(console.error);
    }
  }, [config.userId]);

  async function addQuestion() {
    if (!newQuestion.trim()) return;
    const fieldKey = newFieldKey.trim() || slugify(newQuestion);
    setQLoading(true);
    try {
      await api.qualificationQuestions.save({
        userId: config.userId,
        questionText: newQuestion.trim(),
        fieldKey,
        isRequired: newRequired,
        sortOrder: questions.length,
      });
      const updated = await api.qualificationQuestions.list(config.userId);
      if (Array.isArray(updated)) setQuestions(updated);
      setNewQuestion('');
      setNewFieldKey('');
      setNewRequired(true);
    } catch (err) {
      console.error('[AgentConfigTab] addQuestion error', err);
    } finally {
      setQLoading(false);
    }
  }

  async function deleteQuestion(id: string) {
    try {
      await api.qualificationQuestions.delete(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error('[AgentConfigTab] deleteQuestion error', err);
    }
  }

  async function reorderQuestion(index: number, direction: 'up' | 'down') {
    const newList = [...questions];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newList.length) return;
    [newList[index], newList[swapIndex]] = [newList[swapIndex], newList[index]];
    // Update sort_order
    const updated = newList.map((q, i) => ({ ...q, sortOrder: i }));
    setQuestions(updated);
    try {
      await Promise.all(updated.map((q) => api.qualificationQuestions.save({ ...q, userId: config.userId })));
    } catch (err) {
      console.error('[AgentConfigTab] reorder error', err);
    }
  }

  const isFree = config.plan === 'starter' || !config.plan;

  return (
    <div className="max-w-2xl space-y-8">
      {/* AI Model Selector */}
      <div className="space-y-4">
        <label className="text-sm font-bold text-white/60">AI Model</label>
        <div className="grid grid-cols-3 gap-3">
          {AI_MODELS.map((m) => {
            const locked = !m.free && !plan.features.aiModels.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => !locked && setConfig((prev) => ({ ...prev, aiModel: m.id }))}
                disabled={locked}
                className={cn(
                  'p-4 rounded-2xl border text-left transition-all space-y-1 relative',
                  locked
                    ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/10'
                    : (config.aiModel ?? 'gemini') === m.id
                    ? 'bg-cyan-600/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                    : 'bg-white/5 border-white/10 hover:border-white/20',
                )}
              >
                {locked && <Lock className="absolute top-3 right-3 w-3 h-3 text-white/20" />}
                <p className={cn('text-[10px] font-black uppercase tracking-widest', (config.aiModel ?? 'gemini') === m.id && !locked ? 'text-cyan-400' : 'text-white/60')}>
                  {m.label}
                </p>
                <p className="text-[9px] text-white/30 leading-relaxed">
                  {locked ? 'Pro plan required' : m.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Business Name */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-white/60">Business Name</label>
        <input
          placeholder="Your business name"
          className="w-full bg-black/40 border border-cyan-500/20 rounded-2xl p-4 text-sm outline-none focus:border-cyan-500 transition-all"
          value={config.name}
          onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
        />
      </div>

      {/* Business Description */}
      <div className="space-y-4">
        <label className="text-sm font-bold text-white/60">Business Description</label>
        <textarea
          placeholder="Tell the AI about your business, what you do, and how you want to be represented..."
          className="w-full h-40 bg-black/40 border border-cyan-500/20 rounded-2xl p-6 text-xs font-mono outline-none focus:border-cyan-500 transition-all placeholder:text-white/20"
          value={config.description}
          onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
        />
      </div>

      {/* Brand Color */}
      <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl">
        <div>
          <h4 className="font-bold">Brand Color</h4>
          <p className="text-sm text-white/40">Customize the widget color to match your brand.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={config.brandColor}
            onChange={(e) => setConfig((prev) => ({ ...prev, brandColor: e.target.value }))}
            className="w-10 h-10 bg-transparent border-none cursor-pointer"
          />
          <span className="text-xs font-mono text-white/60 uppercase">{config.brandColor}</span>
        </div>
      </div>

      {/* Widget Position */}
      <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl">
        <div>
          <h4 className="font-bold">Widget Position</h4>
          <p className="text-sm text-white/40">Where should the chat bubble appear?</p>
        </div>
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setConfig((prev) => ({ ...prev, widgetPosition: 'bottom-left' }))}
            className={cn('px-4 py-2 text-xs font-bold rounded-lg transition-all', config.widgetPosition === 'bottom-left' ? 'bg-white text-black' : 'text-white/40 hover:text-white')}
          >
            Left
          </button>
          <button
            onClick={() => setConfig((prev) => ({ ...prev, widgetPosition: 'bottom-right' }))}
            className={cn('px-4 py-2 text-xs font-bold rounded-lg transition-all', config.widgetPosition === 'bottom-right' ? 'bg-white text-black' : 'text-white/40 hover:text-white')}
          >
            Right
          </button>
        </div>
      </div>

      {/* Negotiation Mode */}
      <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl">
        <div>
          <h4 className="font-bold">Negotiation Mode</h4>
          <p className="text-sm text-white/40">Allow AI to negotiate prices down to your minimum.</p>
          {!plan.features.negotiationMode && (
            <p className="text-[10px] text-amber-400 mt-1 font-bold uppercase tracking-widest">Pro plan required</p>
          )}
        </div>
        <div
          onClick={() => plan.features.negotiationMode && setConfig((prev) => ({ ...prev, negotiationMode: !prev.negotiationMode }))}
          className={cn('w-12 h-6 rounded-full relative transition-colors', plan.features.negotiationMode ? 'cursor-pointer' : 'opacity-30 cursor-not-allowed', config.negotiationMode && plan.features.negotiationMode ? 'bg-cyan-500' : 'bg-white/10')}
        >
          <motion.div animate={{ x: config.negotiationMode ? 24 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
        </div>
      </div>

      {/* ─── Widget Customization ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest">Widget Customization</h3>

        {/* Background Style */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <h4 className="font-bold">Background Style</h4>
          <div className="flex gap-2">
            {(['dark', 'light', 'glass'] as WidgetBgStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => setConfig((prev) => ({ ...prev, widgetBgStyle: style }))}
                className={cn(
                  'flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all',
                  config.widgetBgStyle === style ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white',
                )}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Border Radius */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <h4 className="font-bold">Border Radius</h4>
          <div className="flex gap-2">
            {(['sharp', 'rounded', 'pill'] as WidgetBorderRadius[]).map((r) => (
              <button
                key={r}
                onClick={() => setConfig((prev) => ({ ...prev, widgetBorderRadius: r }))}
                className={cn(
                  'flex-1 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all',
                  r === 'sharp' ? 'rounded-none' : r === 'rounded' ? 'rounded-xl' : 'rounded-full',
                  config.widgetBorderRadius === r ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white',
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Avatar URL */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <h4 className="font-bold">Avatar URL</h4>
          <input
            placeholder="https://example.com/avatar.png"
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-cyan-500 transition-all"
            value={config.widgetAvatarUrl || ''}
            onChange={(e) => setConfig((prev) => ({ ...prev, widgetAvatarUrl: e.target.value }))}
          />
        </div>

        {/* Welcome Message */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <h4 className="font-bold">Welcome Message</h4>
          <input
            placeholder="Hi! How can I help you today?"
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-cyan-500 transition-all"
            value={config.widgetWelcomeMessage || ''}
            onChange={(e) => setConfig((prev) => ({ ...prev, widgetWelcomeMessage: e.target.value }))}
          />
        </div>

        {/* Auto-open Delay */}
        <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl">
          <div>
            <h4 className="font-bold">Auto-open Delay</h4>
            <p className="text-sm text-white/40">Seconds before widget auto-opens. 0 = disabled.</p>
          </div>
          <input
            type="number"
            min={0}
            max={60}
            value={config.widgetAutoOpenDelay ?? 0}
            onChange={(e) => setConfig((prev) => ({ ...prev, widgetAutoOpenDelay: Number(e.target.value) }))}
            className="w-20 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-cyan-500 text-center"
          />
        </div>

        {/* Powered By Badge — only show toggle on free plan */}
        {isFree && (
          <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div>
              <h4 className="font-bold">Powered by Repliexa Badge</h4>
              <p className="text-sm text-white/40">Upgrade to Pro to hide the badge.</p>
            </div>
            <div className="w-12 h-6 bg-cyan-500 rounded-full relative opacity-50 cursor-not-allowed">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        )}
        {!isFree && (
          <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div>
              <h4 className="font-bold">Powered by Repliexa Badge</h4>
              <p className="text-sm text-white/40">Show or hide the Repliexa branding.</p>
            </div>
            <div
              onClick={() => setConfig((prev) => ({ ...prev, showPoweredBy: !prev.showPoweredBy }))}
              className={cn('w-12 h-6 rounded-full relative cursor-pointer transition-colors', config.showPoweredBy ? 'bg-cyan-500' : 'bg-white/10')}
            >
              <motion.div animate={{ x: config.showPoweredBy ? 24 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow" />
            </div>
          </div>
        )}

        {/* Live Preview */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <h4 className="font-bold">Live Preview</h4>
          <div className="flex justify-end">
            <div
              className={cn(
                'w-72 h-48 border flex flex-col overflow-hidden shadow-xl',
                config.widgetBgStyle === 'dark' ? 'bg-[#0a0a0a] border-white/10' : config.widgetBgStyle === 'light' ? 'bg-white border-gray-200' : 'bg-white/10 backdrop-blur border-white/20',
                config.widgetBorderRadius === 'sharp' ? 'rounded-none' : config.widgetBorderRadius === 'pill' ? 'rounded-3xl' : 'rounded-2xl',
              )}
            >
              {/* Header */}
              <div className="flex items-center gap-2 p-3 border-b border-white/10" style={{ backgroundColor: config.brandColor + '22' }}>
                {config.widgetAvatarUrl ? (
                  <img src={config.widgetAvatarUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: config.brandColor }}>
                    {(config.name || 'A').charAt(0)}
                  </div>
                )}
                <span className={cn('text-[10px] font-bold', config.widgetBgStyle === 'light' ? 'text-gray-800' : 'text-white')}>
                  {config.name || 'Your Business'}
                </span>
              </div>
              {/* Message area */}
              <div className="flex-1 p-3 flex flex-col justify-end gap-2">
                <div className="self-start max-w-[80%] px-3 py-2 rounded-xl text-[10px]" style={{ backgroundColor: config.brandColor + '33', color: config.widgetBgStyle === 'light' ? '#111' : '#fff' }}>
                  {config.widgetWelcomeMessage || 'Hi! How can I help you today?'}
                </div>
              </div>
              {config.showPoweredBy && (
                <div className="px-3 pb-2 text-center">
                  <span className="text-[8px] text-white/20">Powered by Repliexa</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Qualification Questions ──────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest">Qualification Questions</h3>
        <p className="text-xs text-white/30">The AI will ask these questions naturally during conversation to qualify leads.</p>

        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="flex items-center gap-3 p-4 bg-black/40 border border-white/10 rounded-xl">
              <div className="flex flex-col gap-1">
                <button onClick={() => reorderQuestion(i, 'up')} disabled={i === 0} className="text-white/20 hover:text-white disabled:opacity-10 transition-colors">
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button onClick={() => reorderQuestion(i, 'down')} disabled={i === questions.length - 1} className="text-white/20 hover:text-white disabled:opacity-10 transition-colors">
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{q.questionText}</p>
                <p className="text-[10px] text-white/30 font-mono">{q.fieldKey}{q.isRequired ? ' · required' : ''}</p>
              </div>
              <button onClick={() => deleteQuestion(q.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {questions.length === 0 && (
            <p className="text-center text-white/20 py-4 text-[10px] uppercase tracking-widest font-mono italic">
              No questions yet.
            </p>
          )}
        </div>

        {/* Add question form */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <input
            placeholder="Question text (e.g. What's your budget?)"
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-cyan-500 transition-all"
            value={newQuestion}
            onChange={(e) => {
              setNewQuestion(e.target.value);
              if (!newFieldKey) setNewFieldKey(slugify(e.target.value));
            }}
          />
          <div className="flex items-center gap-3">
            <input
              placeholder="field_key (auto)"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
              value={newFieldKey}
              onChange={(e) => setNewFieldKey(e.target.value)}
            />
            <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newRequired}
                onChange={(e) => setNewRequired(e.target.checked)}
                className="accent-cyan-500"
              />
              Required
            </label>
            <button
              onClick={addQuestion}
              disabled={qLoading || !newQuestion.trim()}
              className="flex items-center gap-1 px-4 py-2 bg-cyan-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-500 transition-all disabled:opacity-40"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Voice Chat (coming soon) */}
      <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl">
        <div>
          <h4 className="font-bold">Voice Chat</h4>
          <p className="text-sm text-white/40">Enable real-time voice conversations.</p>
        </div>
        <div className="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer opacity-50">
          <div className="absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full" />
        </div>
      </div>

      <button
        onClick={onSave}
        className="w-full py-4 bg-cyan-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] border border-cyan-400/50 uppercase tracking-widest text-xs"
      >
        <Save className="w-5 h-5" /> Save Configuration
      </button>
    </div>
  );
}
