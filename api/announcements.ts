import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getActiveAnnouncements } from './lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const announcements = await getActiveAnnouncements();
    return res.json(announcements);
  } catch (err) {
    console.error('[api/announcements]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
