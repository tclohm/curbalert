import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { reports } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ platform, params }) => {
  const db = drizzle(platform?.env?.DB);
  const [report] = await db.select({
    vehicle_make: reports.vehicle_make,
    vehicle_model: reports.vehicle_model,
    vehicle_color: reports.vehicle_color,
    license_plate: reports.license_plate,
    plate_state: reports.plate_state,
    address: reports.address,
    reason: reports.reason,
    notes: reports.notes,
    status: reports.status,
    created_at: reports.created_at
  }).from(reports).where(eq(reports.edit_token, params.token)).limit(1);

  if (!report) return json({ error: 'Report not found' }, { status: 404 });
  return json({ report });
};

export const PATCH: RequestHandler = async ({ request, platform, params }) => {
  const db = drizzle(platform?.env?.DB);
  const data = await request.json();

  const [existing] = await db.select({ id: reports.id })
    .from(reports).where(eq(reports.edit_token, params.token)).limit(1);
  if (!existing) return json({ error: 'Report not found' }, { status: 404 });

  // Deliberately limited: reporters can correct notes/reason/address,
  // but not status (admin-only), plate/make/model/email (identity fields
  // your report_count and rate-limit logic depend on)
  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (typeof data.notes === 'string') updates.notes = data.notes || null;
  if (typeof data.reason === 'string') updates.reason = data.reason;
  if (typeof data.address === 'string' && data.address.trim()) updates.address = data.address;

  await db.update(reports).set(updates).where(eq(reports.edit_token, params.token));
  return json({ success: true });
};
