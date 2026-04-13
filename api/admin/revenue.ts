import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getAdminRevenue } from '../lib/db';
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
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const userId = await requireAuth(req as any);
    const email = await getAdminEmail(userId);
    if (!isAdmin(email)) throw new ForbiddenError();
    const revenue = await getAdminRevenue();
    return res.json(revenue);
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    if (err instanceof ForbiddenError) return res.status(403).json({ error: 'Forbidden' });
    console.error('[api/admin/revenue]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
