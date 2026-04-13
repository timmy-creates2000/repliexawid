import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getActiveAnnouncements, createAnnouncement, toggleAnnouncement, getDb } from '../lib/db';
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

    // GET — all announcements (admin sees all, not just active)
    if (req.method === 'GET') {
      const db = getDb();
      const result = await db.execute('SELECT * FROM announcements ORDER BY created_at DESC');
      return res.json(result.rows);
    }

    // POST — create announcement
    if (req.method === 'POST') {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: 'message required' });
      const id = await createAnnouncement(message);
      return res.json({ success: true, id });
    }

    // PATCH — toggle active
    if (req.method === 'PATCH') {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { isActive } = req.body;
      await toggleAnnouncement(id, isActive);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    if (err instanceof ForbiddenError) return res.status(403).json({ error: 'Forbidden' });
    console.error('[api/admin/announcements]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
