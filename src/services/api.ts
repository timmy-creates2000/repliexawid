import { useAuth } from '@clerk/clerk-react';
import type {
  BusinessConfig, Product, Lead, Booking, SessionType,
  AvailabilityRule, TimeSlot, QualificationQuestion, Automation,
  Transaction, PlanConfig, Announcement, Stats, ChatRequest, ChatResponse,
} from '../lib/types';

// ─── Auth Token Helper ────────────────────────────────────────────────────────

let _getToken: (() => Promise<string | null>) | null = null;

export function setTokenProvider(fn: () => Promise<string | null>) {
  _getToken = fn;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = _getToken ? await _getToken() : null;
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function get<T>(url: string, auth = false): Promise<T> {
  const headers = auth ? await authHeaders() : { 'Content-Type': 'application/json' };
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json();
}

async function post<T>(url: string, body: unknown, auth = false): Promise<T> {
  const headers = auth ? await authHeaders() : { 'Content-Type': 'application/json' };
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || 'Request failed'), { status: res.status, data: err });
  }
  return res.json();
}

async function patch<T>(url: string, body: unknown, auth = false): Promise<T> {
  const headers = auth ? await authHeaders() : { 'Content-Type': 'application/json' };
  const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`PATCH ${url} failed: ${res.status}`);
  return res.json();
}

async function del<T>(url: string, auth = true): Promise<T> {
  const headers = auth ? await authHeaders() : {};
  const res = await fetch(url, { method: 'DELETE', headers });
  if (!res.ok) throw new Error(`DELETE ${url} failed: ${res.status}`);
  return res.json();
}

// ─── API Object ───────────────────────────────────────────────────────────────

export const api = {
  config: {
    get: (userId: string) => get<any>(`/api/config?userId=${userId}`),
    search: (query: string) => get<any>(`/api/config?query=${encodeURIComponent(query)}`),
    save: (data: Partial<BusinessConfig> & { userId?: string }) => post<{ success: boolean }>('/api/config', data, true),
    updatePlan: (plan: string) => post<{ success: boolean }>('/api/config?plan=true', { plan }, true),
  },

  chat: {
    send: (payload: ChatRequest) => post<ChatResponse>('/api/chat', payload),
  },

  products: {
    list: (userId: string) => get<Product[]>(`/api/products?userId=${userId}`),
    save: (product: Partial<Product> & { userId?: string }) => post<{ success: boolean }>('/api/products', product, true),
    delete: (id: string) => del<{ success: boolean }>(`/api/products?id=${id}`),
  },

  leads: {
    list: () => get<Lead[]>('/api/leads', true),
    create: (data: { userId: string; name?: string; email?: string; phone?: string; qualificationData?: Record<string, string> }) =>
      post<{ success: boolean; id: string }>('/api/leads', data),
    updateQualification: (id: string, qualificationData: Record<string, string>) =>
      patch<{ success: boolean }>(`/api/leads?id=${id}`, { qualificationData }),
  },

  bookings: {
    list: (status?: string) => get<Booking[]>(`/api/bookings${status ? `?status=${status}` : ''}`, true),
    create: (data: { userId: string; sessionTypeId: string; startTime: string; visitorName: string; visitorEmail: string }) =>
      post<{ bookingId: string; requiresPayment: boolean; sessionType: SessionType; status: string }>('/api/bookings', data),
    updateStatus: (id: string, status: string) => patch<{ success: boolean }>(`/api/bookings?id=${id}`, { status }, true),
  },

  slots: {
    get: (userId: string, startDate: string, endDate: string, sessionTypeId?: string) => {
      const params = new URLSearchParams({ startDate, endDate });
      if (sessionTypeId) params.set('sessionTypeId', sessionTypeId);
      return get<{ slots: TimeSlot[] }>(`/api/slots?userId=${userId}&${params}`);
    },
  },

  sessionTypes: {
    list: (userId: string) => get<SessionType[]>(`/api/session-types?userId=${userId}`),
    save: (data: Partial<SessionType> & { userId?: string }) => post<{ success: boolean }>('/api/session-types', data, true),
    delete: (id: string) => del<{ success: boolean }>(`/api/session-types?id=${id}`),
  },

  availability: {
    list: (userId: string) => get<AvailabilityRule[]>(`/api/availability?userId=${userId}`),
    save: (data: Partial<AvailabilityRule> & { userId?: string }) => post<{ success: boolean }>('/api/availability', data, true),
    delete: (id: string) => del<{ success: boolean }>(`/api/availability?id=${id}`),
  },

  qualificationQuestions: {
    list: (userId: string) => get<QualificationQuestion[]>(`/api/qualification-questions?userId=${userId}`),
    save: (data: Partial<QualificationQuestion> & { userId?: string }) => post<{ success: boolean }>('/api/qualification-questions', data, true),
    delete: (id: string) => del<{ success: boolean }>(`/api/qualification-questions?id=${id}`),
  },

  automations: {
    list: () => get<Automation[]>('/api/automations', true),
    save: (data: Partial<Automation> & { userId?: string }) => post<{ success: boolean }>('/api/automations', data, true),
    toggle: (id: string, isEnabled: boolean) => patch<{ success: boolean }>(`/api/automations?id=${id}`, { isEnabled }, true),
  },

  transactions: {
    list: () => get<Transaction[]>('/api/transactions', true),
    create: (data: { userId: string; amount: number; currency?: string; method: string; reference?: string; productId?: string; bookingId?: string }) =>
      post<{ success: boolean; id: string; reference: string }>('/api/transactions', data),
  },

  stats: {
    get: () => get<Stats>('/api/stats', true),
  },

  plans: {
    list: () => get<PlanConfig[]>('/api/plans'),
  },

  google: {
    getAuthUrl: () => get<{ authUrl: string }>('/api/google-auth?action=url', true),
  },

  announcements: {
    list: () => get<Announcement[]>('/api/announcements'),
  },

  admin: {
    users: {
      list: () => get<any[]>('/api/admin/users', true),
      updatePlan: (userId: string, plan: string) => patch<{ success: boolean }>(`/api/admin/users?userId=${userId}`, { plan }, true),
    },
    plans: {
      list: () => get<PlanConfig[]>('/api/admin/plans', true),
      update: (planId: string, data: Partial<PlanConfig>) => patch<{ success: boolean }>(`/api/admin/plans?planId=${planId}`, data, true),
    },
    revenue: {
      get: () => get<any>('/api/admin/revenue', true),
    },
    announcements: {
      list: () => get<Announcement[]>('/api/admin/announcements', true),
      create: (message: string) => post<{ success: boolean; id: string }>('/api/admin/announcements', { message }, true),
      toggle: (id: string, isActive: boolean) => patch<{ success: boolean }>(`/api/admin/announcements?id=${id}`, { isActive }, true),
    },
  },
};
