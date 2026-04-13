import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb, getQualificationQuestions, upsertQualificationQuestion, deleteQualificationQuestion } from './lib/db';
import { requireAuth, AuthError } from './lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();

    // GET /api/qualification-questions?userId=... — public
    if (req.method === 'GET') {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: 'userId required' });
      const questions = await getQualificationQuestions(userId);
      return res.json(questions);
    }

    // POST /api/qualification-questions — protected
    if (req.method === 'POST') {
      const userId = await requireAuth(req as any);
      const { id, questionText, fieldKey, isRequired, sortOrder } = req.body;
      if (!questionText || !fieldKey) {
        return res.status(400).json({ error: 'questionText and fieldKey required' });
      }
      await upsertQualificationQuestion({ id, userId, questionText, fieldKey, isRequired: isRequired ?? true, sortOrder: sortOrder ?? 0 });
      return res.json({ success: true });
    }

    // DELETE /api/qualification-questions?id=... — protected
    if (req.method === 'DELETE') {
      const userId = await requireAuth(req as any);
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: 'id required' });
      await deleteQualificationQuestion(id, userId);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: 'Unauthorized' });
    console.error('[api/qualification-questions]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
