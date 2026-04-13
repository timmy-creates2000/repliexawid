import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getConfig, upsertConfig, getDb } from './lib/db';
import { requireAuth, AuthError, ForbiddenError } from './lib/auth';

// Secret fields never returned to public callers
const SECRET_FIELDS = [
  'paystack_secret_key',
  'flutterwave_secret_key',
  'stripe_secret_key',
  'google_access_token',
  'google_refresh_token',
  'resend_api_key',
];

function stripSecrets(row: Record<string, any>): Record<string, any> {
  const result = { ...row };
  for (const field of SECRET_FIELDS) delete result[field];
  return result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();

    // GET /api/config/search?query=...
    if (req.method === 'GET' && req.query.query !== undefined) {
      const { query } = req.query;
      const db = getDb();
      const result = await db.execute({
        sql: 'SELECT * FROM business_configs WHERE user_id = ? OR name LIKE ?',
        args: [query, `%${query}%`],
      });
      const row = result.rows[0];
      if (!row) return res.status(404).json(null);
      return res.json(stripSecrets(row as any));
    }

    // GET /api/config/:userId
    if (req.method === 'GET') {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: 'userId required' });
      const config = await getConfig(userId);
      if (!config) return res.status(404).json(null);
      return res.json(stripSecrets(config));
    }

    // POST /api/config — upsert full config (protected)
    if (req.method === 'POST' && !req.query.plan) {
      const userId = await requireAuth(req as any);
      const body = req.body;

      await upsertConfig(userId, {
        name: body.name,
        description: body.description,
        negotiation_mode: body.negotiationMode ? 1 : 0,
        brand_color: body.brandColor,
        widget_position: body.widgetPosition,
        widget_bg_style: body.widgetBgStyle,
        widget_border_radius: body.widgetBorderRadius,
        widget_avatar_url: body.widgetAvatarUrl ?? null,
        widget_welcome_message: body.widgetWelcomeMessage ?? null,
        widget_auto_open_delay: body.widgetAutoOpenDelay ?? 0,
        show_powered_by: body.showPoweredBy ? 1 : 0,
        payment_method: body.paymentMethod,
        bank_name: body.bankName ?? null,
        account_number: body.accountNumber ?? null,
        paystack_public_key: body.paystackPublicKey ?? null,
        paystack_secret_key: body.paystackSecretKey ?? null,
        flutterwave_public_key: body.flutterwavePublicKey ?? null,
        flutterwave_secret_key: body.flutterwaveSecretKey ?? null,
        stripe_public_key: body.stripePublicKey ?? null,
        stripe_secret_key: body.stripeSecretKey ?? null,
        currency: body.currency ?? 'NGN',
        google_client_id: body.googleClientId ?? null,
        resend_api_key: body.resendApiKey ?? null,
        ai_model: body.aiModel ?? 'gemini',
      });

      return res.json({ success: true });
    }

    // POST /api/config?plan=true — update plan only (protected)
    if (req.method === 'POST' && req.query.plan) {
      const userId = await requireAuth(req as any);
      const { plan } = req.body;
      if (!['starter', 'pro', 'business'].includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan' });
      }
      await upsertConfig(userId, { plan });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    if (err instanceof ForbiddenError) return res.status(403).json({ error: 'Forbidden' });
    console.error('[api/config]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
