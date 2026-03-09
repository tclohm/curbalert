import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { reports } from '$lib/server/db/schema';
import { eq, and, or, like, gt, sql, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ platform, url }) => {
	try {
		const db = drizzle(platform?.env?.DB);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '20');
    const offset = (page - 1) * limit;
    const search = url.searchParams.get('search') ?? '';
    const status = url.searchParams.get('status') ?? 'all';

    // build where conditions
    const conditions = [];

    if (status !== 'all') {
      conditions.push(eq(reports.status, status))
    }

    if (search) {
      conditions.push(
        or(
          like(reports.license_plate, `%${search}%`),
          like(reports.vehicle_make, `%${search}%`),
          like(reports.vehicle_model, `%${search}%`),
          like(reports.vehicle_color, `%${search}%`),
          like(reports.address, `%${search}%`),
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(reports)
      .where(whereClause);
    const total = Number(totalResults[0].count);
    const totalPages = Math.ceil(total / limit);

		// Fetch paginated + filtered reports
		const allReports = await db
			.select()
			.from(reports)
      .where(whereClause)
			.orderBy(desc(reports.created_at))
      .limit(limit)
      .offset(offset);

		return json({ reports: allReports, total, page, totalPages });
	} catch (error) {
		console.error('Error fetching reports:', error);
		return json({ error: 'Failed to fetch reports' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const db = drizzle(platform?.env?.DB);
		const data = await request.json();

		// Validate required fields
		const requiredFields = [
			'reporterEmail',
			'vehicleMake',
			'vehicleModel',
			'vehicleColor',
			'licensePlate',
			'plateState',
			'address',
			'reason',
			'photoBase64'
		];

		for (const field of requiredFields) {
			if (!data[field]) {
				return json({ error: `Missing required field: ${field}` }, { status: 400 });
			}
		}

		// Check for rate limiting - same email reporting same car within 72 hours
		const seventyTwoHoursAgo = Math.floor(Date.now() / 1000) - (72 * 60 * 60);
		
		const duplicateReports = await db
			.select({
				id: reports.id,
				createdAt: reports.created_at
			})
			.from(reports)
			.where(
				and(
					eq(reports.reporter_email, data.reporterEmail),
					eq(reports.license_plate, data.licensePlate.toUpperCase()),
					eq(reports.plate_state, data.plateState),
					gt(reports.created_at, new Date(seventyTwoHoursAgo * 1000))
				)
			)
			.limit(1);

		if (duplicateReports.length > 0) {
			const hoursRemaining = Math.ceil((duplicateReports[0].createdAt - seventyTwoHoursAgo) / 3600);
			return json({ 
				error: `You already reported this vehicle. Please wait ${hoursRemaining} more hours before reporting again.` 
			}, { status: 429 }); // 429 = Too Many Requests
		}

		const now = Math.floor(Date.now() / 1000);

		// Insert the report using Drizzle
		const result = await db.insert(reports).values({
      reporter_email: data.reporterEmail,
      vehicle_make: data.vehicleMake,
      vehicle_model: data.vehicleModel,
      vehicle_color: data.vehicleColor,
      license_plate: data.licensePlate.toUpperCase(),
      plate_state: data.plateState,
      address: data.address,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      reason: data.reason,
      notes: data.notes || null,
      photo_base64: data.photoBase64,
      status: 'open',
      created_at: new Date(now * 1000),
      updated_at: new Date(now * 1000)
    }).returning({ id: reports.id });

		return json({ 
			success: true,
			id: result[0].id
		});
	} catch (error) {
		console.error('Error creating report:', error);
		return json({ error: 'Failed to create report' }, { status: 500 });
	}
};
