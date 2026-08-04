import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { votes } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ request, platform, params }) => {
  const db = drizzle(platform?.env?.DB);
  const { voterToken } = await request.json();
  if (!voterToken) return json({ error: 'Missing voter token' }, { status: 400 });

  try {
    await db.insert(votes).values({ report_id: params.id, voter_token: voterToken });
  } catch (e: any) {
    // unique index violation = they already voted on this report
    if (String(e?.message ?? e).includes('UNIQUE')) {
      return json({ error: 'Already voted' }, { status: 409 });
    }
    throw e;
  }

  return json({ success: true });
};
