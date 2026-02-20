import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

export const reports = sqliteTable('reports', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // reporter info
  reporter_email: text('reporter_email').notNull(),

  // vehicle info
	license_plate: text('license_plate').notNull(),
  plate_state: text('plate_state').notNull(),
  vehicle_make: text('vehicle_make').notNull(),
  vehicle_model: text('vehicle_model'),
  vehicle_color: text('vehicle_color').notNull(),

  // location 
  latitude: real('latitude'),
  longitude: real('longitude'),
  address: text('address'), // reverse geocoded from lat/lng

  // details -- '72 hours', 'expired tags', 'other'
  reason: text('reason').notNull(),
  notes: text('notes'),
  photo_url: text('photo_url'), // URL or base64

  // track status -- 'pending', 'submitted to ciy', 'resolved', 'dismissed'
  status: text('status').notNull().default('pending'),

	created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
