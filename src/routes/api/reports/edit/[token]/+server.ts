import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { reports } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ platform, params }) => {
  const db = drizzle(platform?.env?.DB);
  const [reporter] = await db.select().from(reporters).where(eq(reporters.token, params.token)).limit(1);
  if (!reporter) return json({ error: 'Not found'}, { status: 404 });
  
  const myReports = await db.select().from(reports)
    .where(eq(reports.reporter_email, reporter.email))
    .orderBy(desc(reports.created_at));

  return json({ reports: myReports });
 };

export const PATCH: RequestHandler = async ({ request, platform, params }) => {
  const db = drizzle(platform?.env?.DB);
  const data = await request.json();

  const [reporter] = await db.select().from(reporters).where(eq(reporters.token, params.token)).limit(1);
  if (!reporter) return json({ error: 'Not found' }, { status: 404 });

  // confirm this report actually belongs to this reporter 
  // before allowing edits
  const [existing] = await db.select({ id: reports.id })
    .from(reports).where(and(eq(reports.id, data.reportId), eq(reports.reporter_email, reporter.email))).limit(1);
  if (!existing) return json({ error: 'Report not found' }, { status: 404 });

  // Deliberately limited: reporters can correct notes/reason/address,
  // but not status (admin-only), plate/make/model/email (identity fields
  // your report_count and rate-limit logic depend on)
  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (typeof data.notes === 'string') updates.notes = data.notes || null;
  if (typeof data.reason === 'string') updates.reason = data.reason;
  if (typeof data.address === 'string' && data.address.trim()) updates.address = data.address;

  await db.update(reports).set(updates).where(eq(reports.id, data.reportId));
  return json({ success: true });
};
