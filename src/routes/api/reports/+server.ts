import { json } from '@sveltejs/kit';
import { getDB } from '$lib/server/db';
import { reports } from '$lib/server/db/schema';
import type { RequestHandler } from './$type';

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
			status: 'pending'
    }).returning();

    return json({ success: true, report: newReport[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return json({ error: 'Failed to create report' }, { status: 500 });
  }
}
