import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getPlans, upsertPlan } from '../lib/db';
import { requireAuth, isAdmin, AuthError, ForbiddenError } from '../lib/auth';
import { createClerkClient } from '@clerk/backend';

async function getAdminEmail(userId: string): Promise<string> {
  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
    const user = await clerk.users.getUser(userId);
    return user.emailAddresses[0]?.emailAddress ?? '';
  } catch { return ''; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();
    const userId = await requireAuth(req as any);
    const email = await getAdminEmail(userId);
    if (!isAdmin(email)) throw new ForbiddenError();

    // GET /api/admin/plans
    if (req.method === 'GET') {
      const plans = await getPlans();
      return res.json(plans);
    }

    // PATCH /api/admin/plans?planId=...
    if (req.method === 'PATCH') {
      const planId = req.query.planId as string;
      if (!planId) return res.status(400).json({ error: 'planId required' });
      const { priceNgn, priceUsd, maxProducts, maxLeads, maxChats, featuresJson } = req.body;
      await upsertPlan({ planId, priceNgn, priceUsd, maxProducts, maxLeads, maxChats, featuresJson });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    if (err instanceof ForbiddenError) return res.status(403).json({ error: 'Forbidden' });
    console.error('[api/admin/plans]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
