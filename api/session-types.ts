import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getSessionTypes, upsertSessionType, deleteSessionType } from './lib/db';
import { requireAuth, AuthError } from './lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();

    // GET /api/session-types?userId=... — public
    if (req.method === 'GET') {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: 'userId required' });
      const types = await getSessionTypes(userId);
      return res.json(types);
    }

    // POST /api/session-types — protected
    if (req.method === 'POST') {
      const userId = await requireAuth(req as any);
      const { id, name, durationMinutes, price, isFree, description } = req.body;
      if (!name) return res.status(400).json({ error: 'name required' });
      if (durationMinutes !== undefined && durationMinutes <= 0) {
        return res.status(400).json({ error: 'durationMinutes must be > 0' });
      }
      if (price !== undefined && price < 0) {
        return res.status(400).json({ error: 'price must be >= 0' });
      }
      await upsertSessionType({ id, userId, name, durationMinutes: durationMinutes ?? 60, price: price ?? 0, isFree: isFree ?? false, description: description ?? '' });
      return res.json({ success: true });
    }

    // DELETE /api/session-types?id=... — protected
    if (req.method === 'DELETE') {
      const userId = await requireAuth(req as any);
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: 'id required' });
      await deleteSessionType(id, userId);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    console.error('[api/session-types]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
