import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getAutomations, upsertAutomation, updateAutomation } from './lib/db';
import { requireAuth, AuthError } from './lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();

    // GET /api/automations — protected
    if (req.method === 'GET') {
      const userId = await requireAuth(req as any);
      const automations = await getAutomations(userId);
      return res.json(automations);
    }

    // POST /api/automations — protected
    if (req.method === 'POST') {
      const userId = await requireAuth(req as any);
      const { triggerEvent, actionType, isEnabled, configJson } = req.body;
      if (!triggerEvent || !actionType) {
        return res.status(400).json({ error: 'triggerEvent and actionType required' });
      }
      await upsertAutomation({ userId, triggerEvent, actionType, isEnabled: isEnabled ?? false, configJson: configJson ?? {} });
      return res.json({ success: true });
    }

    // PATCH /api/automations?id=... — protected
    if (req.method === 'PATCH') {
      const userId = await requireAuth(req as any);
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { isEnabled, configJson } = req.body;
      await updateAutomation(id, { isEnabled, configJson });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    console.error('[api/automations]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
