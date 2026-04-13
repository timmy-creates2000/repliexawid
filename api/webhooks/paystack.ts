import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { initDb, updateTransaction, getDb } from '../lib/db';
import { dispatch } from '../lib/automations';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) return res.status(500).json({ error: 'Paystack not configured' });

    // Verify HMAC-SHA512 signature
    const signature = req.headers['x-paystack-signature'] as string;
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (!signature || hash !== signature) {
      return res.status(401).end();
    }

    const { event, data } = req.body;

    if (event === 'charge.success') {
      const reference = data?.reference;
      if (!reference) return res.status(400).end();

      await initDb();
      await updateTransaction(reference, 'success');

      // Find userId from transaction
      const db = getDb();
      const txResult = await db.execute({
        sql: 'SELECT user_id FROM transactions WHERE reference = ?',
        args: [reference],
      });
      const userId = (txResult.rows[0] as any)?.user_id;
      if (userId) {
        void dispatch('payment_confirmed', userId, { reference, amount: data?.amount, currency: data?.currency });
      }
    }

    return res.status(200).end();
  } catch (err) {
    console.error('[webhooks/paystack]', err);
    return res.status(500).end();
  }
}
