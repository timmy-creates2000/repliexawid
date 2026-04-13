import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getDb } from './lib/db';
import { requireAuth, AuthError } from './lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initDb();
    const userId = await requireAuth(req as any);
    const db = getDb();

    const result = await db.execute({
      sql: 'SELECT * FROM subscriptions WHERE user_id = ? AND is_active = 1',
      args: [userId],
    });

    const sub = result.rows[0] as any;
    if (!sub) return res.json({ active: false, plan: 'starter' });

    const expiresAt = new Date(sub.expires_at);
    const isExpired = expiresAt < new Date();

    if (isExpired) {
      // Revert to starter
      await db.execute({
        sql: 'UPDATE subscriptions SET is_active = 0 WHERE user_id = ?',
        args: [userId],
      });
      await db.execute({
        sql: "UPDATE business_configs SET plan = 'starter' WHERE user_id = ?",
        args: [userId],
      });
      return res.json({ active: false, plan: 'starter', expired: true });
    }

    return res.json({
      active: true,
      plan: sub.plan_id,
      expiresAt: sub.expires_at,
      amount: sub.amount,
      currency: sub.currency,
      daysLeft: Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    });
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    console.error('[api/subscription]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
