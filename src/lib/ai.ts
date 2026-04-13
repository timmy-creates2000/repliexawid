import { GoogleGenAI } from "@google/genai";

export type AIModel = 'gemini' | 'openai' | 'grok';

export interface BusinessConfig {
  userId: string;
  name: string;
  description: string;
  products: Product[];
  negotiationMode: boolean;
  aiModel?: AIModel;
  paymentMethod: 'flutterwave' | 'paystack' | 'manual';
  flutterwaveKeys?: { publicKey: string; secretKey: string };
  paystackKeys?: { publicKey: string; secretKey: string };
  paymentKeys?: { publicKey: string; secretKey: string };
  bankDetails?: { bankName: string; accountNumber: string };
  brandColor: string;
  widgetPosition: 'bottom-right' | 'bottom-left';
  googleClientId?: string;
  plan?: 'free' | 'pro' | 'business';
  chatCount?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  lastPrice: number;
  description: string;
  type: 'digital' | 'service' | 'physical';
  link?: string;
}

export interface NegotiationState {
  productId: string | null;
  originalPrice: number;
  currentOffer: number;
  minPrice: number;
  offerCount: number; // how many times customer has countered
  status: 'idle' | 'negotiating' | 'agreed' | 'rejected';
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
  timestamp: Date;
}

// ─── System Prompt Builder ────────────────────────────────────────────────────

function buildSystemPrompt(config: BusinessConfig, negotiation: NegotiationState): string {
  const productList = config.products.length > 0
    ? config.products.map(p =>
        `  • [ID: ${p.id}] ${p.name} (${p.type}) — Price: ₦${p.price.toLocaleString()}, Min: ₦${p.lastPrice.toLocaleString()}\n    Description: ${p.description}`
      ).join('\n')
    : '  No products listed yet.';

  const paymentInstructions = config.paymentMethod === 'manual'
    ? `Bank Transfer — Bank: ${config.bankDetails?.bankName}, Account: ${config.bankDetails?.accountNumber}`
    : config.paymentMethod === 'paystack'
    ? `Paystack — when customer confirms purchase, respond with exactly: INITIATE_PAYMENT:[productId]:[agreedPrice]`
    : `Flutterwave — when customer confirms purchase, respond with exactly: INITIATE_PAYMENT:[productId]:[agreedPrice]`;

  const negotiationContext = negotiation.status === 'negotiating'
    ? `\nACTIVE NEGOTIATION:
  Product ID: ${negotiation.productId}
  Original Price: ₦${negotiation.originalPrice.toLocaleString()}
  Customer's Last Offer: ₦${negotiation.currentOffer.toLocaleString()}
  Your Floor (never go below): ₦${negotiation.minPrice.toLocaleString()}
  Number of counter-offers so far: ${negotiation.offerCount}
  Strategy: ${negotiation.offerCount === 0 ? 'Hold firm or offer small discount' : negotiation.offerCount === 1 ? 'Meet halfway between their offer and your floor' : 'This is your final offer — go to floor price or walk away politely'}`
    : '';

  return `You are an elite AI Sales Agent for "${config.name}".

BUSINESS: ${config.description}

PRODUCTS:
${productList}

SALES RULES:
1. Be persuasive, warm, and professional. Mirror the customer's energy.
2. Negotiation Mode: ${config.negotiationMode ? 'ON — you CAN negotiate but NEVER go below the Min price' : 'OFF — hold firm on listed prices'}.
3. When a customer asks about price, always lead with value before mentioning cost.
4. If they push back on price, acknowledge their concern, then counter strategically.
5. After 3 rounds of negotiation, either close at floor price or politely end negotiation.
6. When customer agrees to buy, confirm the product name and final price, then trigger payment.
7. For digital products: do NOT share the download link — tell them it will be sent after payment.
8. For services: collect their preferred date/time and email before triggering payment.
9. Capture customer name and email naturally in conversation — don't make it feel like a form.
10. Keep responses concise — max 3 sentences unless explaining a product.

PAYMENT:
${paymentInstructions}
${negotiationContext}

IMPORTANT: When triggering payment, include INITIATE_PAYMENT:[productId]:[finalPrice] on its own line at the END of your message. The UI will handle the rest — do not show raw URLs.`;
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

async function callGemini(
  message: string,
  history: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      ...history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.parts }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ],
    config: { systemInstruction: systemPrompt, temperature: 0.75 }
  });
  return response.text ?? '';
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────

async function callOpenAI(
  message: string,
  history: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.parts })),
    { role: 'user', content: message }
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.75, max_tokens: 500 })
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  return data.choices[0]?.message?.content ?? '';
}

// ─── Grok ─────────────────────────────────────────────────────────────────────

async function callGrok(
  message: string,
  history: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROK_API_KEY;
  if (!apiKey) throw new Error('Grok API key not configured');

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.parts })),
    { role: 'user', content: message }
  ];

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'grok-3-mini', messages, temperature: 0.75, max_tokens: 500 })
  });

  if (!res.ok) throw new Error(`Grok error: ${res.status}`);
  const data = await res.json();
  return data.choices[0]?.message?.content ?? '';
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export interface AgentResponse {
  text: string;
  paymentTrigger: { productId: string; amount: number } | null;
  detectedEmail: string | null;
  detectedName: string | null;
}

export async function getAgentResponse(
  message: string,
  history: ChatMessage[],
  config: BusinessConfig,
  negotiation: NegotiationState
): Promise<AgentResponse> {
  const systemPrompt = buildSystemPrompt(config, negotiation);
  const model = config.aiModel ?? 'gemini';

  let raw = '';
  try {
    if (model === 'openai') raw = await callOpenAI(message, history, systemPrompt);
    else if (model === 'grok') raw = await callGrok(message, history, systemPrompt);
    else raw = await callGemini(message, history, systemPrompt);
  } catch (err) {
    console.error(`[${model}] error:`, err);
    // Fallback to Gemini if another model fails
    if (model !== 'gemini') {
      try { raw = await callGemini(message, history, systemPrompt); }
      catch { raw = "I'm having trouble connecting right now. Please try again in a moment."; }
    } else {
      raw = "I'm having trouble connecting right now. Please try again in a moment.";
    }
  }

  // Parse payment trigger
  const paymentMatch = raw.match(/INITIATE_PAYMENT:([^:\n]+):(\d+)/);
  const paymentTrigger = paymentMatch
    ? { productId: paymentMatch[1].trim(), amount: parseInt(paymentMatch[2]) }
    : null;

  // Strip the trigger token from visible text
  const text = raw.replace(/INITIATE_PAYMENT:[^\n]+/g, '').trim();

  // Extract email and name from message
  const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const nameMatch = message.match(/(?:i(?:'m| am)|my name is|call me)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i);

  return {
    text,
    paymentTrigger,
    detectedEmail: emailMatch ? emailMatch[0] : null,
    detectedName: nameMatch ? nameMatch[1] : null,
  };
}
