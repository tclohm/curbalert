import { json } from '@sveltejs/kit';
import { getDB } from '$lib/server/db';
import { reports } from '$lib/server/db/schema';
import type { RequestHandler } from './$type';

export const GET: RequestHandler = async ({ platform }) => {
  try {
    const db = getDB(platform!.env);

    const result = await db.prepare(`
      SELECT
        id,
        vehicle_make as vehicleMake,
        vehicle_model as vehicleModel,
        vehicle_color as vehicleColor,
        license_plate as licensePlate,
        plate_state as plateState,
        address,
        reason,
        notes,
        status,
        created_at as createdAt,
        updated_at as updatedAt 
      FROM reports 
      ORDER BY created_at DESC
    `).all();

    return json({ reports: result.results || [] }); 
  } catch (error) {
    console.error('Error fetching reports:', error);
    return json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const body = await request.json();
    
    // validate required fields
    if (!body.reporterEmail || !body.licensePlate || !body.vehicleMake || !body.vehicleColor) {
      return json({ error: 'Missing required fields'}, { status: 400 });
    }
    // instance
    const db = getDB(platform!.env);

    // insert report 
    const newReport = await db.insert(reports).values({
			reporter_email: body.reporterEmail,
			license_plate: body.licensePlate.toUpperCase(),
			plate_state: body.plateState || 'CA',
			vehicle_make: body.vehicleMake,
			vehicle_model: body.vehicleModel || null,
			vehicle_color: body.vehicleColor,
			latitude: body.latitude || null,
			longitude: body.longitude || null,
			address: body.address || null,
			reason: body.reason,
			notes: body.notes || null,
			photo_url: body.photoBase64 || null, // Store base64 in photo_url field
			status: 'open',
    }).returning();

    return json({ success: true, report: newReport[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return json({ error: 'Failed to create report' }, { status: 500 });
  }
}
