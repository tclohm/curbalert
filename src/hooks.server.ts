import type { Handle } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { adminSessions, admins } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { SESSION_COOKIE_NAME, sha256Hex } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get(SESSION_COOKIE_NAME);

  if (token && event.platform?.env?.DB) {
    const db = drizzle(event.platform.env.DB);
    const tokenHash = await sha256Hex(token);

    const [session] = await db
      .select({ adminId: adminSessions.admin_id, expiresAt: adminSessions.expires_at })
      .from(adminSessions)
      .where(eq(adminSessions.token_hash, tokenHash))
      .limit(1);

    if (session && session.expiresAt.getTime() > Date.now()) {
      const [admin] = await db
        .select({ id: admins.id, email: admins.email })
        .from(admins)
        .where(eq(admins.id, session.adminId))
        .limit(1);

      if (admin) {
        event.locals.admin = admin; // downstreamed to load function
      }
    }
  }

  return resolve(event);
};
