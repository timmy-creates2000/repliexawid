import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getTransactions, createTransaction } from './lib/db';
import { requireAuth, AuthError } from './lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();

    // GET /api/transactions/:userId — protected
    if (req.method === 'GET') {
      const userId = await requireAuth(req as any);
      const transactions = await getTransactions(userId);
      return res.json(transactions);
    }

    // POST /api/transactions — public (creates pending record before gateway opens)
    if (req.method === 'POST') {
      const { userId, amount, currency, method, reference, productId, bookingId } = req.body;
      if (!userId || !amount || !method) return res.status(400).json({ error: 'userId, amount, method required' });
      const ref = reference || `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const id = await createTransaction({ userId, amount, currency: currency ?? 'NGN', method, status: 'pending', reference: ref, productId, bookingId });
      return res.json({ success: true, id, reference: ref });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    console.error('[api/transactions]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
