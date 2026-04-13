import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getStats } from './lib/db';
import { requireAuth, AuthError } from './lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const userId = await requireAuth(req as any);
    const stats = await getStats(userId);
    return res.json(stats);
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    console.error('[api/stats]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
