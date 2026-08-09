import { integer, sqliteTable, text, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
  photo_base64: text('photo_base64'), // compressed base64 image

  // track status -- 'open', 'investigating', 'resolved', 'dismissed'
  status: text('status').notNull().default('pending'),
  
  // grouping -- this is for admins -- they can manually merge cars that are the same
  vehicle_group_id: text('vehicle_group_id').references(() => vehicleGroups.id),

  // timestamps
	created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
    plateIdx: index('plate_index').on(table.license_plate, table.plate_state),
    vehicleGroupIdx: index('vehicle_group_index').on(table.vehicle_group_id),
}));

export const reporters = sqliteTable('reporters', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull(),
  token: text('token').notNull().$defaultFn(() => crypto.randomUUID()),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
    emailIdx: uniqueIndex('reporter_email_idx').on(table.email),
    tokenIdx: uniqueIndex('reporter_token_idx').on(table.token)
}));

export const votes = sqliteTable('votes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  report_id: text('report_id').notNull().references(() => reports.id),
  voter_token: text('voter_token').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  // one vote per (report, voter) - stop inifite upvoting
  uniqueVote: uniqueIndex('unique_vote_idx').on(table.report_id, table.voter_token),
}));

export const admins = sqliteTable('admins', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull(),
  password_hash: text('password_hash').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  uniqueEmail: uniqueIndex('admin_email_idx').on(table.email),
}));

export const adminSessions = sqliteTable('admin_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  admin_id: text('admin_id').notNull().references(() => admins.id),
  token_hash: text('token_hash').notNull(),
  expires_at: integer('expires_at', { mode: 'timestamp'}).notNull(),
}, (table) => ({
  uniqueToken: uniqueIndex('token_hash_idx').on(table.token_hash), 
}));

export const vehicleGroups = sqliteTable('vehicle_groups', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  note: text('note'),
  created_by: text('created_by').references(() => admins.id),
  created_at: integer('created_at', { mode: 'timestamp'}).$defaultFn(() => new Date())
})
