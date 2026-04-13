import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getDb } from './lib/db';
import { requireAuth, AuthError } from './lib/auth';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly'].join(' ');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();

    // GET /api/google-auth?action=url — protected, returns OAuth URL
    if (req.method === 'GET' && req.query.action === 'url') {
      const userId = await requireAuth(req as any);
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        response_type: 'code',
        scope: SCOPES,
        access_type: 'offline',
        prompt: 'consent',
        state: userId,
      });
      return res.json({ authUrl: `${GOOGLE_AUTH_URL}?${params}` });
    }

    // GET /api/google-auth?code=...&state=... — OAuth callback from Google
    if (req.method === 'GET' && req.query.code) {
      const { code, state: userId } = req.query;
      if (!code || !userId) return res.status(400).send('Missing code or state');

      // Exchange code for tokens
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenRes.ok) {
        console.error('[google-auth] Token exchange failed:', await tokenRes.text());
        return res.redirect(`${process.env.APP_URL}/dashboard?tab=integrations&google=error`);
      }

      const tokens = await tokenRes.json();
      const db = getDb();
      await db.execute({
        sql: 'UPDATE business_configs SET google_access_token = ?, google_refresh_token = ? WHERE user_id = ?',
        args: [tokens.access_token, tokens.refresh_token, userId as string],
      });

      return res.redirect(`${process.env.APP_URL}/dashboard?tab=integrations&google=connected`);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    console.error('[api/google-auth]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
