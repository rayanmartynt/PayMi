import { pgTable, serial, text, varchar, decimal, timestamp, uuid, boolean, index } from 'drizzle-orm/pg-core';

const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
  twoFactorSecret: varchar('two_factor_secret', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

const merchants = pgTable('merchants', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  businessType: varchar('business_type', { length: 50 }).notNull(),
  businessEmail: varchar('business_email', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 20 }),
  businessAddress: varchar('business_address', { length: 500 }),
  profilePicture: varchar('profile_picture', { length: 500 }),
  balance: decimal('balance', { precision: 15, scale: 2 }).default('0').notNull(),
  isApproved: boolean('is_approved').default(false).notNull(),
  kycVerified: boolean('kyc_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('merchants_user_id_idx').on(table.userId),
}));

const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  address: varchar('address', { length: 500 }),
  profilePicture: varchar('profile_picture', { length: 500 }),
  balance: decimal('balance', { precision: 15, scale: 2 }).default('0').notNull(),
  kycVerified: boolean('kyc_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('customers_user_id_idx').on(table.userId),
}));

const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  customerId: uuid('customer_id').references(() => customers.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  paymentGateway: varchar('payment_gateway', { length: 50 }),
  transactionReference: varchar('transaction_reference', { length: 255 }).unique(),
  description: text('description'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('transactions_merchant_id_idx').on(table.merchantId),
  customerIdIdx: index('transactions_customer_id_idx').on(table.customerId),
  statusIdx: index('transactions_status_idx').on(table.status),
}));

const customerTransfers = pgTable('customer_transfers', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderId: uuid('sender_id').notNull().references(() => customers.id),
  receiverId: uuid('receiver_id').notNull().references(() => customers.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  fee: decimal('fee', { precision: 15, scale: 2 }).default('0').notNull(),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  senderIdIdx: index('customer_transfers_sender_id_idx').on(table.senderId),
  receiverIdIdx: index('customer_transfers_receiver_id_idx').on(table.receiverId),
  statusIdx: index('customer_transfers_status_idx').on(table.status),
}));

const customerWithdrawals = pgTable('customer_withdrawals', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  fee: decimal('fee', { precision: 15, scale: 2 }).default('0').notNull(),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  rejectionReason: text('rejection_reason'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  customerIdIdx: index('customer_withdrawals_customer_id_idx').on(table.customerId),
  statusIdx: index('customer_withdrawals_status_idx').on(table.status),
}));

const withdrawals = pgTable('withdrawals', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  fee: decimal('fee', { precision: 15, scale: 2 }).default('0').notNull(),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  rejectionReason: text('rejection_reason'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('withdrawals_merchant_id_idx').on(table.merchantId),
  statusIdx: index('withdrawals_status_idx').on(table.status),
}));

const kycDocuments = pgTable('kyc_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').references(() => merchants.id),
  customerId: uuid('customer_id').references(() => customers.id),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  documentNumber: varchar('document_number', { length: 100 }),
  frontImageUrl: varchar('front_image_url', { length: 500 }),
  backImageUrl: varchar('back_image_url', { length: 500 }),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  rejectionReason: text('rejection_reason'),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('kyc_documents_merchant_id_idx').on(table.merchantId),
  customerIdIdx: index('kyc_documents_customer_id_idx').on(table.customerId),
  statusIdx: index('kyc_documents_status_idx').on(table.status),
}));

const customerKycDocuments = pgTable('customer_kyc_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  documentNumber: varchar('document_number', { length: 100 }),
  frontImageUrl: varchar('front_image_url', { length: 500 }),
  backImageUrl: varchar('back_image_url', { length: 500 }),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  rejectionReason: text('rejection_reason'),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  customerIdIdx: index('customer_kyc_documents_customer_id_idx').on(table.customerId),
  statusIdx: index('customer_kyc_documents_status_idx').on(table.status),
}));

const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  key: varchar('key', { length: 255 }).notNull().unique(),
  secret: varchar('secret', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  permissions: text('permissions'),
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('api_keys_merchant_id_idx').on(table.merchantId),
  keyIdx: index('api_keys_key_idx').on(table.key),
}));

const webhooks = pgTable('webhooks', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  url: varchar('url', { length: 500 }).notNull(),
  secret: varchar('secret', { length: 255 }).notNull(),
  events: text('events').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastTriggeredAt: timestamp('last_triggered_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('webhooks_merchant_id_idx').on(table.merchantId),
}));

const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false).notNull(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.userId),
  readIdx: index('notifications_read_idx').on(table.read),
}));

const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  deviceInfo: text('device_info'),
  ipAddress: varchar('ip_address', { length: 50 }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  tokenIdx: index('sessions_token_idx').on(table.token),
}));

const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index('refresh_tokens_token_idx').on(table.token),
  userIdIdx: index('refresh_tokens_user_id_idx').on(table.userId),
}));

const adminFees = pgTable('admin_fees', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  fee: decimal('fee', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  referenceId: varchar('reference_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  typeIdx: index('admin_fees_type_idx').on(table.type),
  createdAtIdx: index('admin_fees_created_at_idx').on(table.createdAt),
}));

const disputes = pgTable('disputes', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull(),
  transactionId: uuid('transaction_id'),
  transferId: uuid('transfer_id'),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  status: varchar('status', { length: 50 }).default('OPEN').notNull(),
  resolution: text('resolution'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  customerIdIdx: index('disputes_customer_id_idx').on(table.customerId),
  statusIdx: index('disputes_status_idx').on(table.status),
}));

const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  action: varchar('action', { length: 100 }).notNull(),
  userId: uuid('user_id').notNull(),
  userType: varchar('user_type', { length: 50 }).notNull(),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  timestampIdx: index('audit_logs_timestamp_idx').on(table.timestamp),
}));

module.exports = {
  users,
  merchants,
  customers,
  transactions,
  customerTransfers,
  customerWithdrawals,
  withdrawals,
  kycDocuments,
  customerKycDocuments,
  apiKeys,
  webhooks,
  notifications,
  sessions,
  refreshTokens,
  adminFees,
  disputes,
  auditLogs,
};
