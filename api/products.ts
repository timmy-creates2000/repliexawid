import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getProducts, upsertProduct, deleteProduct, getPlans, getConfig } from './lib/db';
import { requireAuth, AuthError, ForbiddenError } from './lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();

    // GET /api/products/:userId — public
    if (req.method === 'GET') {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: 'userId required' });
      const products = await getProducts(userId);
      return res.json(products);
    }

    // POST /api/products — protected
    if (req.method === 'POST') {
      const userId = await requireAuth(req as any);
      const body = req.body;

      // Enforce plan product limit
      const [plans, config, existing] = await Promise.all([
        getPlans(),
        getConfig(userId),
        getProducts(userId),
      ]);
      const userPlan = plans.find((p: any) => p.plan_id === (config?.plan ?? 'starter'));
      const maxProducts = userPlan?.max_products ?? 3;
      if (maxProducts !== -1 && existing.length >= maxProducts) {
        return res.status(403).json({ error: 'plan_limit_reached', message: `Upgrade your plan to add more than ${maxProducts} products.` });
      }

      await upsertProduct({ ...body, userId });
      return res.json({ success: true });
    }

    // DELETE /api/products/:id — protected
    if (req.method === 'DELETE') {
      const userId = await requireAuth(req as any);
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: 'id required' });
      await deleteProduct(id, userId);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    if (err instanceof ForbiddenError) return res.status(403).json({ error: 'Forbidden' });
    console.error('[api/products]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
