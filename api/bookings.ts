import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getBookings, createBooking, updateBooking, getSessionTypes, getDb } from './lib/db';
import { requireAuth, AuthError } from './lib/auth';
import { dispatch } from './lib/automations';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();

    // GET /api/bookings?status=... — protected
    if (req.method === 'GET') {
      const userId = await requireAuth(req as any);
      const status = req.query.status as string | undefined;
      const bookings = await getBookings(userId, status);
      return res.json(bookings);
    }

    // POST /api/bookings — public (called from widget)
    if (req.method === 'POST') {
      const { userId, sessionTypeId, startTime, visitorName, visitorEmail } = req.body;
      if (!userId || !sessionTypeId || !startTime || !visitorEmail) {
        return res.status(400).json({ error: 'userId, sessionTypeId, startTime, visitorEmail required' });
      }

      // Load session type to get duration
      const sessionTypes = await getSessionTypes(userId);
      const sessionType = sessionTypes.find((s: any) => s.id === sessionTypeId);
      if (!sessionType) return res.status(404).json({ error: 'Session type not found' });

      // Calculate end time
      const start = new Date(startTime);
      const end = new Date(start.getTime() + sessionType.duration_minutes * 60 * 1000);

      // Atomically check for slot conflict
      const db = getDb();
      const conflict = await db.execute({
        sql: `SELECT id FROM bookings
              WHERE user_id = ? AND status != 'cancelled'
              AND start_time < ? AND end_time > ?`,
        args: [userId, end.toISOString(), start.toISOString()],
      });

      if (conflict.rows.length > 0) {
        return res.status(409).json({
          error: 'slot_taken',
          message: 'This slot was just booked. Please choose another time.',
        });
      }

      // Create booking as pending
      const bookingId = await createBooking({
        userId,
        visitorName: visitorName || 'Anonymous',
        visitorEmail,
        sessionTypeId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: 'pending',
      });

      // If free session — confirm immediately
      if (sessionType.is_free || sessionType.price === 0) {
        await updateBooking(bookingId, { status: 'confirmed' });
        void dispatch('booking_confirmed', userId, {
          bookingId,
          visitorName,
          visitorEmail,
          sessionTypeName: sessionType.name,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          meetLink: null,
        });

        return res.json({
          bookingId,
          requiresPayment: false,
          sessionType: { name: sessionType.name, price: 0, duration_minutes: sessionType.duration_minutes },
          status: 'confirmed',
        });
      }

      // Paid session — return pending, widget will open payment
      return res.json({
        bookingId,
        requiresPayment: true,
        sessionType: {
          name: sessionType.name,
          price: sessionType.price,
          duration_minutes: sessionType.duration_minutes,
        },
        status: 'pending',
      });
    }

    // PATCH /api/bookings?id=... — protected (cancel, confirm, etc.)
    if (req.method === 'PATCH') {
      const userId = await requireAuth(req as any);
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: 'id required' });

      const { status } = req.body;
      if (!['confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'status must be confirmed or cancelled' });
      }

      // Verify ownership
      const db = getDb();
      const existing = await db.execute({
        sql: 'SELECT user_id FROM bookings WHERE id = ?',
        args: [id],
      });
      if ((existing.rows[0] as any)?.user_id !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await updateBooking(id, { status });

      if (status === 'confirmed') {
        const booking = await db.execute({ sql: 'SELECT * FROM bookings WHERE id = ?', args: [id] });
        const b = booking.rows[0] as any;
        if (b) {
          void dispatch('booking_confirmed', userId, {
            bookingId: id,
            visitorEmail: b.visitor_email,
            visitorName: b.visitor_name,
            startTime: b.start_time,
            endTime: b.end_time,
          });
        }
      }

      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    console.error('[api/bookings]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
