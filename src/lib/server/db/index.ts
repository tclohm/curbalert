import { drizzle } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

// This function gets the DB instance from Cloudflare's platform context
export function getDB(env: any): DrizzleD1Database<typeof schema> {
	return drizzle(env.DB, { schema });
}
