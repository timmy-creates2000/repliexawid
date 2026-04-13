import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getDb, getConfig } from './lib/db';
import { requireAuth, AuthError } from './lib/auth';

/**
 * POST /api/subscribe
 * Creates a pending subscription transaction and returns
 * the Flutterwave payment data needed to open checkout.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initDb();
    const userId = await requireAuth(req as any);

    // Parse body safely
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const { planId, currency = 'NGN', email, name } = body;

    if (!planId || !email) {
      return res.status(400).json({ error: 'planId and email required' });
    }

    // Load plan prices from DB
    const db = getDb();
    const planResult = await db.execute({
      sql: 'SELECT * FROM plan_prices WHERE plan_id = ?',
      args: [planId],
    });
    const plan = planResult.rows[0] as any;
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    // Determine amount based on currency
    const amount = currency === 'NGN' ? plan.price_ngn : plan.price_usd;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'This plan is free — no payment needed' });
    }

    // Generate unique transaction reference
    const reference = `SUB-${userId.slice(-8)}-${planId.toUpperCase()}-${Date.now()}`;

    // Store pending subscription transaction
    await db.execute({
      sql: `INSERT INTO transactions (id, user_id, amount, currency, method, status, reference)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        Math.random().toString(36).slice(2, 11),
        userId,
        amount,
        currency,
        'flutterwave',
        'pending',
        reference,
      ],
    });

    // Store subscription intent so webhook knows which plan to activate
    await db.execute({
      sql: `INSERT OR REPLACE INTO subscription_intents (reference, user_id, plan_id, currency, amount)
            VALUES (?, ?, ?, ?, ?)`,
      args: [reference, userId, planId, currency, amount],
    });

    return res.json({
      reference,
      amount,
      currency,
      planId,
      planName: planId.charAt(0).toUpperCase() + planId.slice(1),
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
      email,
      name: name || email,
    });
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    console.error('[api/subscribe]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
