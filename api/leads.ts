import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getLeads, createLead, updateLeadQualification } from './lib/db';
import { requireAuth, AuthError } from './lib/auth';
import { dispatch } from './lib/automations';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();

    // GET /api/leads/:userId — protected
    if (req.method === 'GET') {
      const userId = await requireAuth(req as any);
      const leads = await getLeads(userId);
      return res.json(leads);
    }

    // POST /api/leads — public (called from widget)
    if (req.method === 'POST') {
      const { userId, name, email, phone, qualificationData } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId required' });
      const id = await createLead({ userId, name, email, phone, qualificationData });
      // Fire-and-forget automation
      void dispatch('lead_captured', userId, { leadId: id, name, email, phone });
      return res.json({ success: true, id });
    }

    // PATCH /api/leads/:id — public (called from widget to update qualification answers)
    if (req.method === 'PATCH') {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { qualificationData } = req.body;
      if (!qualificationData) return res.status(400).json({ error: 'qualificationData required' });
      await updateLeadQualification(id, qualificationData);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    console.error('[api/leads]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
