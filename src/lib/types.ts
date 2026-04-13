// ─── Core Types ───────────────────────────────────────────────────────────────

export type PlanId = 'starter' | 'pro' | 'business';
export type AIModel = 'gemini' | 'openai' | 'grok';
export type PaymentMethod = 'paystack' | 'flutterwave' | 'stripe' | 'manual';
export type Currency = 'NGN' | 'USD' | 'EUR' | 'GBP';
export type WidgetBgStyle = 'dark' | 'light' | 'glass';
export type WidgetBorderRadius = 'sharp' | 'rounded' | 'pill';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type LeadStatus = 'new' | 'negotiating' | 'converted';
export type TriggerEvent = 'lead_captured' | 'booking_confirmed' | 'payment_confirmed' | 'chat_started';

// ─── Business Config ──────────────────────────────────────────────────────────

export interface BusinessConfig {
  userId: string;
  name: string;
  description: string;
  products: Product[];
  negotiationMode: boolean;
  aiModel: AIModel;
  paymentMethod: PaymentMethod;
  paystackKeys?: { publicKey: string };
  flutterwaveKeys?: { publicKey: string };
  stripeKeys?: { publicKey: string };
  bankDetails?: { bankName: string; accountNumber: string };
  brandColor: string;
  widgetPosition: 'bottom-right' | 'bottom-left';
  widgetBgStyle: WidgetBgStyle;
  widgetBorderRadius: WidgetBorderRadius;
  widgetAvatarUrl?: string;
  widgetWelcomeMessage?: string;
  widgetAutoOpenDelay: number;
  showPoweredBy: boolean;
  currency: Currency;
  googleClientId?: string;
  googleAccessToken?: string;
  plan: PlanId;
  chatCount: number;
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  price: number;
  lastPrice: number;
  description: string;
  type: 'digital' | 'service' | 'physical';
  link?: string;
}

// ─── Session Types & Availability ─────────────────────────────────────────────

export interface SessionType {
  id: string;
  userId: string;
  name: string;
  durationMinutes: number;
  price: number;
  isFree: boolean;
  description: string;
  isActive: boolean;
}

export interface AvailabilityRule {
  id: string;
  userId: string;
  dayOfWeek: number; // 0=Sunday … 6=Saturday
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  bufferMinutes: number;
}

export interface TimeSlot {
  start: string; // ISO datetime
  end: string;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  userId: string;
  visitorName: string;
  visitorEmail: string;
  sessionTypeId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  paymentReference?: string;
  googleEventId?: string;
  meetLink?: string;
  createdAt: string;
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  qualificationData: Record<string, string>;
  createdAt: string;
}

export interface QualificationQuestion {
  id: string;
  userId: string;
  questionText: string;
  fieldKey: string;
  isRequired: boolean;
  sortOrder: number;
}

// ─── Automations ──────────────────────────────────────────────────────────────

export interface Automation {
  id: string;
  userId: string;
  triggerEvent: TriggerEvent;
  actionType: string;
  isEnabled: boolean;
  configJson: Record<string, any>;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  status: 'pending' | 'success' | 'failed';
  reference: string;
  productId?: string;
  bookingId?: string;
  createdAt: string;
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export interface PlanFeatures {
  canEmbed: boolean;
  canCustomDomain: boolean;
  aiModels: AIModel[];
  negotiationMode: boolean;
  analyticsRetentionDays: number;
  prioritySupport: boolean;
}

export interface PlanConfig {
  planId: PlanId;
  priceNgn: number;
  priceUsd: number;
  maxProducts: number;  // -1 = unlimited
  maxLeads: number;
  maxChats: number;
  features: PlanFeatures;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
  timestamp: Date;
}

export interface NegotiationState {
  productId: string | null;
  originalPrice: number;
  currentOffer: number;
  minPrice: number;
  offerCount: number;
  status: 'idle' | 'negotiating' | 'agreed' | 'rejected';
}

export interface ChatRequest {
  userId: string;
  message: string;
  history: { role: string; parts: string }[];
  negotiationState: NegotiationState;
  visitorEmail?: string;
  visitorName?: string;
}

export interface ChatResponse {
  text: string;
  paymentTrigger: { productId: string; amount: number } | null;
  bookingTrigger: boolean;
  detectedEmail: string | null;
  detectedName: string | null;
  error?: string;
}

// ─── Announcements ────────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  message: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface Stats {
  totalSales: number;
  leadsCount: number;
  bookingsCount: number;
  chatsThisMonth: number;
  conversionRate: number;
}
