import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { reports } from '$lib/server/db/schema';
import { eq, and, gt, sql, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const db = drizzle(platform?.env?.DB);

		// Fetch all reports
		const allReports = await db
			.select()
			.from(reports)
			.orderBy(desc(reports.createdAt));

		// Add report count to each report manually
		// (We'll calculate it for each unique plate+state combination)
		const reportsWithCount = await Promise.all(
			allReports.map(async (report) => {
				const count = await db
					.select({ count: sql<number>`count(*)` })
					.from(reports)
					.where(
						and(
							eq(reports.licensePlate, report.licensePlate),
							eq(reports.plateState, report.plateState)
						)
					);

				return {
					...report,
					reportCount: Number(count[0].count)
				};
			})
		);

		return json({ reports: reportsWithCount });
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
				createdAt: reports.createdAt
			})
			.from(reports)
			.where(
				and(
					eq(reports.reporterEmail, data.reporterEmail),
					eq(reports.licensePlate, data.licensePlate.toUpperCase()),
					eq(reports.plateState, data.plateState),
					gt(reports.createdAt, seventyTwoHoursAgo)
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
			reporterEmail: data.reporterEmail,
			vehicleMake: data.vehicleMake,
			vehicleModel: data.vehicleModel,
			vehicleColor: data.vehicleColor,
			licensePlate: data.licensePlate.toUpperCase(),
			plateState: data.plateState,
			address: data.address,
			latitude: data.latitude ? String(data.latitude) : null,
			longitude: data.longitude ? String(data.longitude) : null,
			reason: data.reason,
			notes: data.notes || null,
			photoBase64: data.photoBase64,
			status: 'open',
			createdAt: now,
			updatedAt: now
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
