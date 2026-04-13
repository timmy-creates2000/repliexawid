import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, updateTransaction, getDb } from '../lib/db';
import { dispatch } from '../lib/automations';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return res.status(500).json({ error: 'Stripe not configured' });

    // Dynamically import stripe to keep bundle lean
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

    const sig = req.headers['stripe-signature'] as string;
    let event: any;

    try {
      // req.body must be raw buffer for Stripe signature verification
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch {
      return res.status(401).end();
    }

    if (event.type === 'payment_intent.succeeded') {
      const reference = event.data.object?.metadata?.reference || event.data.object?.id;
      if (!reference) return res.status(400).end();

      await initDb();
      await updateTransaction(reference, 'success');

      const db = getDb();
      const txResult = await db.execute({
        sql: 'SELECT user_id FROM transactions WHERE reference = ?',
        args: [reference],
      });
      const userId = (txResult.rows[0] as any)?.user_id;
      if (userId) {
        void dispatch('payment_confirmed', userId, { reference, amount: event.data.object?.amount, currency: event.data.object?.currency });
      }
    }

    return res.status(200).end();
  } catch (err) {
    console.error('[webhooks/stripe]', err);
    return res.status(500).end();
  }
}
