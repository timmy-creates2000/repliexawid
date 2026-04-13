import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { initDb, getConfig, getProducts, getQualificationQuestions, getSessionTypes, getPlans, getDb } from './lib/db';
import { dispatch } from './lib/automations';

// ─── System Prompt Builder ────────────────────────────────────────────────────

function buildSystemPrompt(
  config: Record<string, any>,
  products: any[],
  questions: any[],
  sessionTypes: any[],
  negotiationState: any
): string {
  const productList = products.length > 0
    ? products.map(p => `  • [ID:${p.id}] ${p.name} (${p.type}) — Price: ${config.currency === 'NGN' ? '₦' : '$'}${p.price.toLocaleString()}, Min: ${config.currency === 'NGN' ? '₦' : '$'}${p.last_price.toLocaleString()}\n    ${p.description}`).join('\n')
    : '  No products listed yet.';

  const questionList = questions.length > 0
    ? `\nQUALIFICATION QUESTIONS (ask these naturally in conversation, in this order):\n${questions.map((q, i) => `  ${i + 1}. ${q.question_text} [field: ${q.field_key}${q.is_required ? ', required' : ''}]`).join('\n')}`
    : '';

  const bookingSection = sessionTypes.length > 0
    ? `\nBOOKING SESSIONS AVAILABLE:\n${sessionTypes.map(s => `  • ${s.name} — ${s.duration_minutes} min — ${s.is_free ? 'FREE' : `${config.currency === 'NGN' ? '₦' : '$'}${s.price.toLocaleString()}`}`).join('\n')}\nWhen a visitor wants to book, respond with INITIATE_BOOKING on its own line.`
    : '';

  const paymentInstructions = config.payment_method === 'manual'
    ? `Bank Transfer — Bank: ${config.bank_name}, Account: ${config.account_number}`
    : config.payment_method === 'paystack'
    ? `Paystack — when visitor confirms purchase, respond with: INITIATE_PAYMENT:[productId]:[agreedPrice]`
    : config.payment_method === 'flutterwave'
    ? `Flutterwave — when visitor confirms purchase, respond with: INITIATE_PAYMENT:[productId]:[agreedPrice]`
    : `Stripe — when visitor confirms purchase, respond with: INITIATE_PAYMENT:[productId]:[agreedPrice]`;

  const negotiationContext = negotiationState?.status === 'negotiating'
    ? `\nACTIVE NEGOTIATION:\n  Product ID: ${negotiationState.productId}\n  Original Price: ${negotiationState.originalPrice}\n  Visitor Offer: ${negotiationState.currentOffer}\n  Your Floor (never go below): ${negotiationState.minPrice}\n  Rounds so far: ${negotiationState.offerCount}\n  Strategy: ${negotiationState.offerCount <= 1 ? 'Hold firm or small discount' : negotiationState.offerCount === 2 ? 'Meet halfway between offer and floor' : 'Final offer — go to floor or politely decline'}`
    : '';

  return `You are an elite AI Sales Agent for "${config.name}".

BUSINESS: ${config.description}

PRODUCTS:
${productList}
${questionList}
${bookingSection}

SALES RULES:
1. Be persuasive, warm, and professional. Mirror the visitor's energy.
2. Negotiation Mode: ${config.negotiation_mode ? 'ON — you CAN negotiate but NEVER go below the Min price' : 'OFF — hold firm on listed prices'}.
3. Lead with value before mentioning cost.
4. After 3 negotiation rounds, close at floor price or politely end.
5. For digital products: do NOT share download links — tell them it will be sent after payment.
6. For services: collect preferred date/time and email before triggering payment.
7. Keep responses concise — max 3 sentences unless explaining a product.
8. Capture visitor name and email naturally in conversation.

PAYMENT:
${paymentInstructions}
${negotiationContext}

IMPORTANT: When triggering payment, include INITIATE_PAYMENT:[productId]:[finalPrice] on its own line at the END of your message. When triggering booking, include INITIATE_BOOKING on its own line.`;
}

// ─── AI Model Callers ─────────────────────────────────────────────────────────

async function callGemini(systemPrompt: string, history: any[], message: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      ...history.map((h: any) => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.parts }] })),
      { role: 'user', parts: [{ text: message }] },
    ],
    config: { systemInstruction: systemPrompt, temperature: 0.75 },
  });
  return response.text ?? '';
}

async function callOpenAI(systemPrompt: string, history: any[], message: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((h: any) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.parts })),
    { role: 'user', content: message },
  ];
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.75, max_tokens: 500 }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  return data.choices[0]?.message?.content ?? '';
}

async function callGrok(systemPrompt: string, history: any[], message: string): Promise<string> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) throw new Error('GROK_API_KEY not set');
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((h: any) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.parts })),
    { role: 'user', content: message },
  ];
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'grok-3-mini', messages, temperature: 0.75, max_tokens: 500 }),
  });
  if (!res.ok) throw new Error(`Grok error: ${res.status}`);
  const data = await res.json();
  return data.choices[0]?.message?.content ?? '';
}

// ─── Response Parser ──────────────────────────────────────────────────────────

function parseResponse(raw: string) {
  const paymentMatch = raw.match(/INITIATE_PAYMENT:([^:\n]+):(\d+)/);
  const paymentTrigger = paymentMatch
    ? { productId: paymentMatch[1].trim(), amount: parseInt(paymentMatch[2]) }
    : null;

  const bookingTrigger = /INITIATE_BOOKING/i.test(raw);

  const text = raw
    .replace(/INITIATE_PAYMENT:[^\n]+/g, '')
    .replace(/INITIATE_BOOKING/gi, '')
    .trim();

  const emailMatch = raw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const nameMatch = raw.match(/(?:i(?:'m| am)|my name is|call me)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i);

  return { text, paymentTrigger, bookingTrigger, detectedEmail: emailMatch?.[0] ?? null, detectedName: nameMatch?.[1] ?? null };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initDb();

    const { userId, message, history = [], negotiationState, visitorEmail, visitorName } = req.body;
    if (!userId || !message) return res.status(400).json({ error: 'userId and message required' });

    // Load business data
    const [config, products, questions, sessionTypes, plans] = await Promise.all([
      getConfig(userId),
      getProducts(userId),
      getQualificationQuestions(userId),
      getSessionTypes(userId),
      getPlans(),
    ]);

    if (!config) return res.status(404).json({ error: 'Business not found' });

    // Enforce chat limit
    const userPlan = plans.find((p: any) => p.plan_id === (config.plan ?? 'starter'));
    const maxChats = userPlan?.max_chats ?? 100;
    if (maxChats !== -1 && (config.chat_count ?? 0) >= maxChats) {
      return res.status(200).json({
        text: '',
        error: 'chat_limit_reached',
        paymentTrigger: null,
        bookingTrigger: false,
        detectedEmail: null,
        detectedName: null,
      });
    }

    // Build system prompt server-side
    const systemPrompt = buildSystemPrompt(config, products, questions, sessionTypes, negotiationState);

    // Call AI model with fallback
    const model = config.ai_model ?? 'gemini';
    let raw = '';
    try {
      if (model === 'openai') raw = await callOpenAI(systemPrompt, history, message);
      else if (model === 'grok') raw = await callGrok(systemPrompt, history, message);
      else raw = await callGemini(systemPrompt, history, message);
    } catch (err) {
      console.error(`[chat] ${model} failed, falling back to Gemini:`, err);
      if (model !== 'gemini') {
        raw = await callGemini(systemPrompt, history, message);
      } else {
        raw = "I'm having trouble connecting right now. Please try again in a moment.";
      }
    }

    const parsed = parseResponse(raw);

    // Increment chat count
    const db = getDb();
    await db.execute({
      sql: 'UPDATE business_configs SET chat_count = chat_count + 1 WHERE user_id = ?',
      args: [userId],
    });

    // Dispatch chat_started automation on first message
    if (history.length === 0) {
      void dispatch('chat_started', userId, { message, visitorEmail, visitorName });
    }

    // Auto-save lead if email detected in message
    const emailInMessage = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
    if (emailInMessage && emailInMessage !== visitorEmail) {
      parsed.detectedEmail = emailInMessage;
    }

    return res.json(parsed);
  } catch (err) {
    console.error('[api/chat]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
