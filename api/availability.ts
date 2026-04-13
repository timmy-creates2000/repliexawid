import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getAvailabilityRules, upsertAvailabilityRule, deleteAvailabilityRule } from './lib/db';
import { requireAuth, AuthError } from './lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();

    // GET /api/availability?userId=... — public
    if (req.method === 'GET') {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: 'userId required' });
      const rules = await getAvailabilityRules(userId);
      return res.json(rules);
    }

    // POST /api/availability — protected
    if (req.method === 'POST') {
      const userId = await requireAuth(req as any);
      const { id, dayOfWeek, startTime, endTime, bufferMinutes } = req.body;
      if (dayOfWeek === undefined || !startTime || !endTime) {
        return res.status(400).json({ error: 'dayOfWeek, startTime, endTime required' });
      }
      if (dayOfWeek < 0 || dayOfWeek > 6) {
        return res.status(400).json({ error: 'dayOfWeek must be 0–6' });
      }
      if (startTime >= endTime) {
        return res.status(400).json({ error: 'startTime must be before endTime' });
      }
      await upsertAvailabilityRule({ id, userId, dayOfWeek, startTime, endTime, bufferMinutes: bufferMinutes ?? 15 });
      return res.json({ success: true });
    }

    // DELETE /api/availability?id=... — protected
    if (req.method === 'DELETE') {
      const userId = await requireAuth(req as any);
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: 'id required' });
      await deleteAvailabilityRule(id, userId);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    console.error('[api/availability]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
