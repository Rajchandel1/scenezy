import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, pgEnum, index, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================
export const userRoleEnum = pgEnum('user_role', ['USER', 'SELLER', 'ADMIN']);
export const passStatusEnum = pgEnum('pass_status', ['ACTIVE', 'USED', 'REVOKED', 'EXPIRED']);
export const transferStatusEnum = pgEnum('transfer_status', ['PENDING', 'CLAIMED', 'EXPIRED', 'CANCELLED']);
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED']);
export const orderStatusEnum = pgEnum('order_status', ['CREATED', 'PAID', 'FAILED']);
export const eventStatusEnum = pgEnum('event_status', ['PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'CANCELLED']);

// ============================================
// USERS (managed by Supabase Auth, extended here)
// ============================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('USER'),
  approved: boolean('approved').default(false),
  rejected: boolean('rejected').default(false),
  suspended: boolean('suspended').default(false),
  emailVerified: boolean('email_verified').default(false),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
}));

// ============================================
// EVENTS
// ============================================
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').default(''),
  date: text('date').notNull(),
  time: text('time').notNull(),
  location: text('location').notNull(),
  locationUrl: text('location_url'),
  venue: text('venue').notNull(),
  category: text('category').default('Other'),
  sellerId: uuid('seller_id').references(() => users.id),
  sellerName: text('seller_name').notNull(),
  status: eventStatusEnum('status').notNull().default('PENDING_APPROVAL'),
  posterUrl: text('poster_url'),
  moderationReason: text('moderation_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  sellerIdx: index('events_seller_idx').on(table.sellerId),
  statusIdx: index('events_status_idx').on(table.status),
  dateIdx: index('events_date_idx').on(table.date),
}));

// Admin-managed discovery taxonomy and user-home composition.
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const homeSections = pgTable('home_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  eyebrow: text('eyebrow').default(''),
  layout: text('layout').notNull().default('FEATURE'),
  eventIds: jsonb('event_ids').$type<string[]>().notNull().default([]),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// PASS TYPES (per event)
// ============================================
export const passTypes = pgTable('pass_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  benefits: text('benefits').default(''),
  available: integer('available').notNull().default(100),
  sold: integer('sold').notNull().default(0),
  transferAllowed: boolean('transfer_allowed').default(true),
}, (table) => ({
  eventIdx: index('pass_types_event_idx').on(table.eventId),
  eventNameUnique:uniqueIndex('pass_types_event_name_unique').on(table.eventId,table.name),
  priceNonnegative:check('pass_types_price_nonnegative',sql`${table.price} >= 0`),
  availabilityNonnegative:check('pass_types_availability_nonnegative',sql`${table.available} >= 0`),
  soldNonnegative:check('pass_types_sold_nonnegative',sql`${table.sold} >= 0`),
}));

// ============================================
// PASSES (individual tickets owned by users)
// ============================================
export const passes = pgTable('passes', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  eventTitle: text('event_title').notNull(),
  passTypeId: uuid('pass_type_id').references(() => passTypes.id).notNull(),
  passTypeName: text('pass_type_name').notNull(),
  price: integer('price').notNull(),
  ownerUserId: uuid('owner_user_id').references(() => users.id).notNull(),
  status: passStatusEnum('status').notNull().default('ACTIVE'),
  credential: text('credential').notNull().unique(),
  eventDate: text('event_date').notNull(),
  eventTime: text('event_time').notNull(),
  eventLocation: text('event_location').notNull(),
  eventVenue: text('event_venue').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index('passes_owner_idx').on(table.ownerUserId),
  credentialIdx: index('passes_credential_idx').on(table.credential),
  statusIdx: index('passes_status_idx').on(table.status),
  eventIdx: index('passes_event_idx').on(table.eventId),
  ownerStatusDateIdx:index('passes_owner_status_date_idx').on(table.ownerUserId,table.status,table.eventDate),
}));

// ============================================
// ORDERS
// ============================================
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  eventTitle: text('event_title').notNull(),
  items: jsonb('items').notNull(),
  subtotal: integer('subtotal').notNull(),
  fees: integer('fees').notNull(),
  total: integer('total').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('PENDING'),
  orderStatus: orderStatusEnum('order_status').notNull().default('CREATED'),
  transactionId: text('transaction_id'),
  providerOrderId: text('provider_order_id').unique(),
  idempotencyKey: text('idempotency_key').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('orders_user_idx').on(table.userId),
  eventIdx: index('orders_event_idx').on(table.eventId),
  totalsNonnegative:check('orders_totals_nonnegative',sql`${table.subtotal} >= 0 and ${table.fees} >= 0 and ${table.total} >= 0`),
}));

// ============================================
// TRANSFERS
// ============================================
export const transfers = pgTable('transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  passId: uuid('pass_id').references(() => passes.id).notNull(),
  senderUserId: uuid('sender_user_id').references(() => users.id).notNull(),
  senderName: text('sender_name').notNull(),
  recipientIdentifier: text('recipient_identifier').notNull(),
  recipientUserId: uuid('recipient_user_id').references(() => users.id),
  status: transferStatusEnum('status').notNull().default('PENDING'),
  eventTitle: text('event_title').notNull(),
  passTypeName: text('pass_type_name').notNull(),
  eventDate: text('event_date').notNull(),
  eventTime: text('event_time').notNull(),
  eventLocation: text('event_location').notNull(),
  eventVenue: text('event_venue').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  claimedAt: timestamp('claimed_at'),
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => ({
  passIdx: index('transfers_pass_idx').on(table.passId),
  senderIdx: index('transfers_sender_idx').on(table.senderUserId),
  recipientIdx: index('transfers_recipient_idx').on(table.recipientIdentifier),
  statusIdx: index('transfers_status_idx').on(table.status),
}));

// ============================================
// ENTRY SCANS
// ============================================
export const entries = pgTable('entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  passId: uuid('pass_id').references(() => passes.id),
  eventId: uuid('event_id').references(() => events.id),
  eventTitle: text('event_title').notNull(),
  passTypeName: text('pass_type_name').notNull(),
  credential: text('credential').notNull(),
  result: text('result').notNull(),
  reason: text('reason').notNull(),
  gate: text('gate').default('Main Gate'),
  scannedAt: timestamp('scanned_at').defaultNow().notNull(),
}, (table) => ({
  eventIdx: index('entries_event_idx').on(table.eventId),
  passIdx: index('entries_pass_idx').on(table.passId),
  scannedIdx: index('entries_scanned_idx').on(table.scannedAt),
}));

// ============================================
// NOTIFICATIONS
// ============================================
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: text('type').notNull().default('info'),
  title: text('title').notNull(),
  body: text('body').notNull(),
  icon: text('icon').default('🔔'),
  read: boolean('read').default(false),
  link: text('link'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('notifications_user_idx').on(table.userId),
  readIdx: index('notifications_read_idx').on(table.userId, table.read),
}));

// ============================================
// AUDIT LOG
// ============================================
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').references(() => users.id),
  actorName: text('actor_name').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  actorIdx: index('audit_actor_idx').on(table.actorId),
  actionIdx: index('audit_action_idx').on(table.action),
  createdIdx: index('audit_created_idx').on(table.createdAt),
}));

export const rateLimits=pgTable('rate_limits',{
  key:text('key').primaryKey(),
  count:integer('count').notNull().default(1),
  resetAt:timestamp('reset_at',{withTimezone:true}).notNull(),
});

// Seller payments are intentionally isolated from checkout and pass issuance.
export const sellerPaymentProfiles=pgTable('seller_payment_profiles',{
  sellerId:uuid('seller_id').primaryKey().references(()=>users.id,{onDelete:'cascade'}),
  upiId:text('upi_id').notNull(),
  phone:text('phone'),
  createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull(),
  updatedAt:timestamp('updated_at',{withTimezone:true}).defaultNow().notNull(),
});

export const withdrawalRequests=pgTable('withdrawal_requests',{
  id:uuid('id').primaryKey().defaultRandom(),
  sellerId:uuid('seller_id').references(()=>users.id,{onDelete:'cascade'}).notNull(),
  amount:integer('amount').notNull(),
  status:text('status').notNull().default('REQUESTED'),
  sellerNote:text('seller_note'),
  adminNote:text('admin_note'),
  paymentReference:text('payment_reference'),
  requestedAt:timestamp('requested_at',{withTimezone:true}).defaultNow().notNull(),
  updatedAt:timestamp('updated_at',{withTimezone:true}).defaultNow().notNull(),
  paidAt:timestamp('paid_at',{withTimezone:true}),
},table=>({sellerIdx:index('withdrawal_requests_seller_idx').on(table.sellerId,table.requestedAt),statusIdx:index('withdrawal_requests_status_idx').on(table.status,table.requestedAt)}));

export const sellerContactRequests=pgTable('seller_contact_requests',{
  id:uuid('id').primaryKey().defaultRandom(),
  sellerId:uuid('seller_id').references(()=>users.id,{onDelete:'cascade'}).notNull(),
  type:text('type').notNull(),
  message:text('message').notNull(),
  phone:text('phone'),
  status:text('status').notNull().default('OPEN'),
  adminNote:text('admin_note'),
  createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull(),
  updatedAt:timestamp('updated_at',{withTimezone:true}).defaultNow().notNull(),
},table=>({sellerIdx:index('seller_contact_requests_seller_idx').on(table.sellerId,table.createdAt),statusIdx:index('seller_contact_requests_status_idx').on(table.status,table.createdAt)}));
