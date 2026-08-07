const { pgTable, uuid, varchar, text, boolean, timestamp, decimal, integer, index } = require('drizzle-orm/pg-core');

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
}, (table) => ({ emailIdx: index('users_email_idx').on(table.email) }));

const merchants = pgTable('merchants', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
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
  userId: uuid('user_id').notNull().unique(),
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
  merchantId: uuid('merchant_id').notNull(),
  customerId: uuid('customer_id'),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  description: text('description'),
  reference: varchar('reference', { length: 255 }).notNull().unique(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('transactions_merchant_id_idx').on(table.merchantId),
  customerIdIdx: index('transactions_customer_id_idx').on(table.customerId),
  statusIdx: index('transactions_status_idx').on(table.status),
  createdAtIdx: index('transactions_created_at_idx').on(table.createdAt),
}));

const customerTransfers = pgTable('customer_transfers', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderId: uuid('sender_id').notNull(),
  receiverId: uuid('receiver_id').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  fee: decimal('fee', { precision: 15, scale: 2 }).default('0').notNull(),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  reference: varchar('reference', { length: 255 }).notNull().unique(),
  reversedAt: timestamp('reversed_at'),
  reversalReason: text('reversal_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  senderIdIdx: index('customer_transfers_sender_id_idx').on(table.senderId),
  receiverIdIdx: index('customer_transfers_receiver_id_idx').on(table.receiverId),
  statusIdx: index('customer_transfers_status_idx').on(table.status),
}));

const customerWithdrawals = pgTable('customer_withdrawals', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  fee: decimal('fee', { precision: 15, scale: 2 }).default('0').notNull(),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  mobileMoneyProvider: varchar('mobile_money_provider', { length: 50 }).notNull(),
  mobileNumber: varchar('mobile_number', { length: 20 }).notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  processedAt: timestamp('processed_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  customerIdIdx: index('customer_withdrawals_customer_id_idx').on(table.customerId),
}));

const withdrawals = pgTable('withdrawals', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  fee: decimal('fee', { precision: 15, scale: 2 }).default('0').notNull(),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  mobileMoneyProvider: varchar('mobile_money_provider', { length: 50 }).notNull(),
  mobileNumber: varchar('mobile_number', { length: 20 }).notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  processedAt: timestamp('processed_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('withdrawals_merchant_id_idx').on(table.merchantId),
}));

const kycDocuments = pgTable('kyc_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  documentUrl: varchar('document_url', { length: 500 }).notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  rejectionReason: text('rejection_reason'),
  adminComment: text('admin_comment'),
  expiryDate: timestamp('expiry_date'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('kyc_documents_merchant_id_idx').on(table.merchantId),
}));

const customerKycDocuments = pgTable('customer_kyc_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  documentUrl: varchar('document_url', { length: 500 }).notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  rejectionReason: text('rejection_reason'),
  adminComment: text('admin_comment'),
  expiryDate: timestamp('expiry_date'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  customerIdIdx: index('customer_kyc_documents_customer_id_idx').on(table.customerId),
}));

const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  publicKey: varchar('public_key', { length: 255 }).notNull().unique(),
  secretKey: varchar('secret_key', { length: 255 }).notNull(),
  webhookSecret: varchar('webhook_secret', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastUsed: timestamp('last_used'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('api_keys_merchant_id_idx').on(table.merchantId),
}));

const webhooks = pgTable('webhooks', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  events: varchar('events', { length: 255 }).notNull(),
  description: text('description'),
  secret: varchar('secret', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  lastTriggered: timestamp('last_triggered'),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }).default('100').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('webhooks_merchant_id_idx').on(table.merchantId),
}));

const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  merchantId: uuid('merchant_id'),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.userId),
  readIdx: index('notifications_read_idx').on(table.read),
  merchantIdIdx: index('notifications_merchant_id_idx').on(table.merchantId),
}));

const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  tokenIdx: index('sessions_token_idx').on(table.token),
}));

const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  userId: uuid('user_id').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('refresh_tokens_user_id_idx').on(table.userId),
  tokenIdx: index('refresh_tokens_token_idx').on(table.token),
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
  userId: uuid('user_id'),
  userType: varchar('user_type', { length: 50 }),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: varchar('user_agent', { length: 500 }),
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

