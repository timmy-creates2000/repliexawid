import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getDb } from '../lib/db';
import { requireAuth, isAdmin, AuthError, ForbiddenError } from '../lib/auth';
import { createClerkClient } from '@clerk/backend';

async function getAdminEmail(userId: string): Promise<string> {
  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
    const user = await clerk.users.getUser(userId);
    return user.emailAddresses[0]?.emailAddress ?? '';
  } catch {
    return '';
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();
    const userId = await requireAuth(req as any);
    const email = await getAdminEmail(userId);
    if (!isAdmin(email)) throw new ForbiddenError();

    const db = getDb();

    // GET /api/admin/users — list all business owners
    if (req.method === 'GET') {
      const result = await db.execute(
        'SELECT user_id, name, plan, created_at FROM business_configs ORDER BY created_at DESC'
      );
      return res.json(result.rows);
    }

    // PATCH /api/admin/users?userId=... — update plan
    if (req.method === 'PATCH') {
      const targetUserId = req.query.userId as string;
      if (!targetUserId) return res.status(400).json({ error: 'userId required' });
      const { plan } = req.body;
      if (!['starter', 'pro', 'business'].includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan' });
      }
      await db.execute({
        sql: 'UPDATE business_configs SET plan = ? WHERE user_id = ?',
        args: [plan, targetUserId],
      });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    if (err instanceof ForbiddenError) return res.status(403).json({ error: 'Forbidden' });
    console.error('[api/admin/users]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
