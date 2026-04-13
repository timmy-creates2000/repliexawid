import type { PlanConfig, PlanId } from './types';

// ─── Hardcoded fallback (used if DB is unavailable) ───────────────────────────

export const PLANS: Record<PlanId, PlanConfig & { name: string; color: string; highlights: string[] }> = {
  starter: {
    planId: 'starter',
    name: 'Starter',
    color: '#6b7280',
    priceNgn: 0,
    priceUsd: 0,
    maxProducts: 3,
    maxLeads: 50,
    maxChats: 100,
    features: {
      canEmbed: false,
      canCustomDomain: false,
      aiModels: ['gemini'],
      negotiationMode: false,
      analyticsRetentionDays: 7,
      prioritySupport: false,
    },
    highlights: ['3 products', '50 leads/month', '100 AI chats/month', 'Gemini AI only', 'Shareable link'],
  },
  pro: {
    planId: 'pro',
    name: 'Pro',
    color: '#06b6d4',
    priceNgn: 2500,
    priceUsd: 5,
    maxProducts: 20,
    maxLeads: 500,
    maxChats: 2000,
    features: {
      canEmbed: true,
      canCustomDomain: false,
      aiModels: ['gemini', 'openai', 'grok'],
      negotiationMode: true,
      analyticsRetentionDays: 30,
      prioritySupport: false,
    },
    highlights: ['20 products', '500 leads/month', '2,000 AI chats/month', 'All AI models', 'Website embed', 'Negotiation mode'],
  },
  business: {
    planId: 'business',
    name: 'Business',
    color: '#a855f7',
    priceNgn: 7500,
    priceUsd: 15,
    maxProducts: -1,
    maxLeads: -1,
    maxChats: -1,
    features: {
      canEmbed: true,
      canCustomDomain: true,
      aiModels: ['gemini', 'openai', 'grok'],
      negotiationMode: true,
      analyticsRetentionDays: 90,
      prioritySupport: true,
    },
    highlights: ['Unlimited products', 'Unlimited leads', 'Unlimited AI chats', 'All AI models', 'Custom domain', 'Priority support'],
  },
};

// ─── DB-driven plan cache ─────────────────────────────────────────────────────

let _cachedPlans: PlanConfig[] | null = null;

export async function fetchPlans(): Promise<PlanConfig[]> {
  if (_cachedPlans) return _cachedPlans;
  try {
    const res = await fetch('/api/plans');
    if (!res.ok) throw new Error('Plans API failed');
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      _cachedPlans = data;
      return data;
    }
  } catch (err) {
    console.warn('[plans] Failed to fetch from DB, using fallback:', err);
  }
  return Object.values(PLANS);
}

export function clearPlanCache() {
  _cachedPlans = null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPlan(planId?: string): typeof PLANS[PlanId] {
  return PLANS[(planId as PlanId) ?? 'starter'] ?? PLANS.starter;
}

export function isWithinLimit(
  plan: PlanConfig | typeof PLANS[PlanId] | undefined,
  feature: 'maxProducts' | 'maxLeads' | 'maxChats',
  current: number
): boolean {
  if (!plan) return true;
  const limit = plan[feature];
  if (limit === -1) return true;
  return current < limit;
}
