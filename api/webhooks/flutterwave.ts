import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, updateTransaction, getDb } from '../lib/db';
import { dispatch } from '../lib/automations';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    if (!secretHash) return res.status(500).json({ error: 'Flutterwave not configured' });

    const signature = req.headers['verif-hash'] as string;
    if (!signature || signature !== secretHash) {
      return res.status(401).end();
    }

    const { event, data } = req.body;

    if (event === 'charge.completed' && data?.status === 'successful') {
      const reference = data?.tx_ref;
      if (!reference) return res.status(400).end();

      await initDb();
      const db = getDb();

      // Update transaction to success
      await updateTransaction(reference, 'success');

      // Check if this is a subscription payment
      const intentResult = await db.execute({
        sql: 'SELECT * FROM subscription_intents WHERE reference = ?',
        args: [reference],
      });
      const intent = intentResult.rows[0] as any;

      if (intent) {
        // This is a plan subscription payment — activate the plan
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 30-day subscription

        // Upsert subscription record
        await db.execute({
          sql: `INSERT INTO subscriptions (id, user_id, plan_id, currency, amount, reference, expires_at, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                ON CONFLICT(user_id) DO UPDATE SET
                  plan_id = excluded.plan_id,
                  currency = excluded.currency,
                  amount = excluded.amount,
                  reference = excluded.reference,
                  started_at = CURRENT_TIMESTAMP,
                  expires_at = excluded.expires_at,
                  is_active = 1`,
          args: [
            Math.random().toString(36).slice(2, 11),
            intent.user_id,
            intent.plan_id,
            intent.currency,
            intent.amount,
            reference,
            expiresAt.toISOString(),
          ],
        });

        // Upgrade the user's plan
        await db.execute({
          sql: 'UPDATE business_configs SET plan = ? WHERE user_id = ?',
          args: [intent.plan_id, intent.user_id],
        });

        // Clean up intent
        await db.execute({
          sql: 'DELETE FROM subscription_intents WHERE reference = ?',
          args: [reference],
        });

        console.log(`[flutterwave] Plan upgraded: user=${intent.user_id} plan=${intent.plan_id}`);

        // Dispatch payment confirmed automation
        void dispatch('payment_confirmed', intent.user_id, {
          reference,
          amount: data?.amount,
          currency: data?.currency,
          planId: intent.plan_id,
        });
      } else {
        // Regular product/booking payment
        const txResult = await db.execute({
          sql: 'SELECT user_id FROM transactions WHERE reference = ?',
          args: [reference],
        });
        const userId = (txResult.rows[0] as any)?.user_id;
        if (userId) {
          void dispatch('payment_confirmed', userId, {
            reference,
            amount: data?.amount,
            currency: data?.currency,
          });
        }
      }
    }

    return res.status(200).end();
  } catch (err) {
    console.error('[webhooks/flutterwave]', err);
    return res.status(500).end();
  }
}
