import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getAvailabilityRules, getBookings, getSessionTypes } from './lib/db';
import { generateSlots } from './lib/slots';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initDb();

    const userId = req.query.userId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const sessionTypeId = req.query.sessionTypeId as string | undefined;

    if (!userId || !startDate || !endDate) {
      return res.status(400).json({ error: 'userId, startDate, endDate required' });
    }

    // Load availability rules and existing bookings in parallel
    const [rules, bookings, sessionTypes] = await Promise.all([
      getAvailabilityRules(userId),
      getBookings(userId),
      getSessionTypes(userId),
    ]);

    // Determine session duration
    let sessionDurationMinutes = 60; // default
    if (sessionTypeId) {
      const st = sessionTypes.find((s: any) => s.id === sessionTypeId);
      if (st) sessionDurationMinutes = st.duration_minutes;
    } else if (sessionTypes.length > 0) {
      sessionDurationMinutes = sessionTypes[0].duration_minutes;
    }

    const slots = generateSlots(
      rules as any[],
      bookings as any[],
      sessionDurationMinutes,
      new Date(startDate),
      new Date(endDate)
    );

    return res.json({ slots });
  } catch (err) {
    console.error('[api/slots]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
