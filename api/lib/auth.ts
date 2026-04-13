import { createClerkClient } from '@clerk/backend';

export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

function getClerk() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('CLERK_SECRET_KEY is not set');
  return createClerkClient({ secretKey });
}

/**
 * Extracts and validates the Clerk Bearer token from the Authorization header.
 * Returns the userId on success, throws AuthError on failure.
 */
export async function requireAuth(req: { headers: Record<string, string | string[] | undefined> }): Promise<string> {
  const authHeader = req.headers['authorization'] as string | undefined;
  if (!authHeader?.startsWith('Bearer ')) throw new AuthError();

  const token = authHeader.slice(7);
  if (!token) throw new AuthError();

  try {
    const clerk = getClerk();
    const payload = await clerk.verifyToken(token);
    if (!payload?.sub) throw new AuthError();
    return payload.sub;
  } catch {
    throw new AuthError();
  }
}

/**
 * Returns true if the given email matches the configured ADMIN_EMAIL env var.
 */
export function isAdmin(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}
