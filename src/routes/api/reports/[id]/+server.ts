import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { reports, votes } from '$lib/server/db/schema';
import { eq, sql, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ platform, params, url }) => {
  const db = drizzle(platform?.env?.DB);
  const voterToken = url.searchParams.get('voterToken');
  const editToken = url.searchParams.get('editToken');

  const [report] = await db.select({
    id: reports.id,
    reporter_email: reports.reporter_email,
    license_plate: reports.license_plate,
    plate_state: reports.plate_state,
    vehicle_make: reports.vehicle_make,
    vehicle_model: reports.vehicle_model,
    vehicle_color: reports.vehicle_color,
    address: reports.address,
    reason: reports.reason,
    notes: reports.notes,
    photo_base64: reports.photo_base64,
    status: reports.status,
    created_at: reports.created_at,
    report_count: sql<number>`(SELECT COUNT(*) FROM reports r2 WHERE r2.license_plate = reports.license_plate AND r2.plate_state = reports.plate_state)`,
    vote_count: sql<number>`(SELECT COUNT(*) FROM votes v WHERE v.report_id = reports.id)`
  }).from(reports).where(eq(reports.id, params.id)).limit(1);

  if (!report) return json({ error: 'Not found' }, { status: 404 });

  let hasVoted = false;
  if (voterToken) {
    const [existing] = await db.select({ id: votes.id }).from(votes)
      .where(and(eq(votes.report_id, params.id), eq(votes.voter_token, voterToken))).limit(1);
    hasVoted = !!existing;
  }

  let canEdit = false;
  if (editToken) {
    const [reporter] = await db.select({ email: reporters.email }).from(reporters)
      .where(eq(reporters.token, editToken)).limit(1);
    canEdit = !!reporter && reporter.email == report.reporter_email;
  }

  return json({ report, hasVoted, canEdit });
};
