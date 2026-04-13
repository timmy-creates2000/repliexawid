import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getPlans } from './lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const plans = await getPlans();
    // Map DB snake_case to camelCase for frontend
    const mapped = plans.map((p: any) => ({
      planId: p.plan_id,
      priceNgn: p.price_ngn,
      priceUsd: p.price_usd,
      maxProducts: p.max_products,
      maxLeads: p.max_leads,
      maxChats: p.max_chats,
      features: (() => {
        try { return JSON.parse(p.features_json || '{}'); } catch { return {}; }
      })(),
    }));
    return res.json(mapped);
  } catch (err) {
    console.error('[api/plans]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
