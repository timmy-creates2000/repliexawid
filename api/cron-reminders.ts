import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getDb } from './lib/db';
import { sendBookingReminder } from './lib/email';

/**
 * Vercel Cron — runs every 15 minutes.
 * Finds bookings starting in 55–65 minutes and sends reminder emails.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron sends GET requests
  if (req.method !== 'GET') return res.status(405).end();

  try {
    await initDb();
    const db = getDb();

    const now = new Date();
    const windowStart = new Date(now.getTime() + 55 * 60 * 1000).toISOString();
    const windowEnd = new Date(now.getTime() + 65 * 60 * 1000).toISOString();

    const result = await db.execute({
      sql: `SELECT b.*, st.name as session_name
            FROM bookings b
            JOIN session_types st ON b.session_type_id = st.id
            WHERE b.status = 'confirmed'
            AND b.start_time >= ? AND b.start_time <= ?`,
      args: [windowStart, windowEnd],
    });

    let sent = 0;
    for (const booking of result.rows as any[]) {
      await sendBookingReminder(booking, booking.user_id);
      sent++;
    }

    return res.json({ success: true, remindersSent: sent });
  } catch (err) {
    console.error('[cron-reminders]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
