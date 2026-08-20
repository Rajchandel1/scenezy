import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, pgEnum, index } from 'drizzle-orm/pg-core';

// ============================================
// ENUMS
// ============================================
export const userRoleEnum = pgEnum('user_role', ['USER', 'SELLER', 'ADMIN']);
export const passStatusEnum = pgEnum('pass_status', ['ACTIVE', 'USED', 'REVOKED', 'EXPIRED']);
export const transferStatusEnum = pgEnum('transfer_status', ['PENDING', 'CLAIMED', 'EXPIRED', 'CANCELLED']);
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED']);
export const orderStatusEnum = pgEnum('order_status', ['CREATED', 'PAID', 'FAILED', 'REFUNDED']);
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
  venue: text('venue').notNull(),
  category: text('category').default('Other'),
  sellerId: uuid('seller_id').references(() => users.id),
  sellerName: text('seller_name').notNull(),
  status: eventStatusEnum('status').notNull().default('PENDING_APPROVAL'),
  posterUrl: text('poster_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  sellerIdx: index('events_seller_idx').on(table.sellerId),
  statusIdx: index('events_status_idx').on(table.status),
  dateIdx: index('events_date_idx').on(table.date),
}));

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
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('orders_user_idx').on(table.userId),
  eventIdx: index('orders_event_idx').on(table.eventId),
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
