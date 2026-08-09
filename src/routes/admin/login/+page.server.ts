import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { admins, adminSessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import {
  verifyPassword,
  generateSessionToken,
  sha256Hex,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS
} from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
  // check locals.admin, redirect if set
  if (locals.admin) {
    throw redirect(303, '/admin');
  }
}

export const actions: Actions = {
  default: async ({ request, platform, cookies }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    const password = String(data.get('password') ?? '');

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required' });
    }

    const db = drizzle(platform?.env?.DB);

    const [admin] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
    if (!admin || !(await verifyPassword(password, admin.password_hash))) {
      return fail(400, { error: 'Invalid email or password' });
    }

    const token = generateSessionToken();
    const tokenHash = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await db.insert(adminSessions).values({
      admin_id: admin.id,
      token_hash: tokenHash,
      expires_at: expiresAt
    });

    cookies.set(SESSION_COOKIE_NAME, token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: expiresAt
    });

    throw redirect(303, '/admin');
  }
};
