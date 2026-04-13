import { getDb } from './db';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

// ─── Token Management ─────────────────────────────────────────────────────────

export async function getValidAccessToken(userId: string): Promise<string> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT google_access_token, google_refresh_token FROM business_configs WHERE user_id = ?',
    args: [userId],
  });
  const row = result.rows[0] as any;
  if (!row?.google_refresh_token) throw new Error('Google account not connected');

  // Try the stored access token first — if it fails we'll refresh
  // For simplicity, always refresh to ensure token is valid
  const refreshed = await refreshAccessToken(row.google_refresh_token);

  // Update stored access token
  await db.execute({
    sql: 'UPDATE business_configs SET google_access_token = ? WHERE user_id = ?',
    args: [refreshed, userId],
  });

  return refreshed;
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

// ─── Calendar Event Creation ──────────────────────────────────────────────────

export async function createCalendarEvent(
  payload: any,
  _config: any,
  userId: string
): Promise<{ eventId: string; meetLink: string }> {
  const accessToken = await getValidAccessToken(userId);

  const startTime = payload.startTime || payload.start_time;
  const endTime = payload.endTime || payload.end_time;
  const visitorEmail = payload.visitorEmail || payload.visitor_email;
  const visitorName = payload.visitorName || payload.visitor_name || 'Visitor';
  const sessionName = payload.sessionTypeName || 'Session';

  const event = {
    summary: `${sessionName} with ${visitorName}`,
    description: `Booking confirmed via Repliexa.\nVisitor: ${visitorName} (${visitorEmail})`,
    start: { dateTime: startTime, timeZone: 'UTC' },
    end: { dateTime: endTime, timeZone: 'UTC' },
    attendees: [{ email: visitorEmail }],
    conferenceData: {
      createRequest: {
        requestId: `repliexa-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const meetLink = data.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri ?? '';

  // Update booking with event ID and meet link
  if (payload.bookingId) {
    const db = getDb();
    await db.execute({
      sql: 'UPDATE bookings SET google_event_id = ?, meet_link = ? WHERE id = ?',
      args: [data.id, meetLink, payload.bookingId],
    });
  }

  return { eventId: data.id, meetLink };
}
