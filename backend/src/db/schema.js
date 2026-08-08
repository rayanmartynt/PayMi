const { pgTable, uuid, varchar, text, boolean, timestamp, decimal, integer, index, uniqueIndex } = require('drizzle-orm/pg-core');

const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }),
  twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
  twoFactorSecret: varchar('two_factor_secret', { length: 255 }),
  emailVerified: boolean('email_verified').default(false).notNull(),
  phoneVerified: boolean('phone_verified').default(false).notNull(),
  verificationCode: varchar('verification_code', { length: 10 }),
  verificationCodeExpires: timestamp('verification_code_expires'),
  phoneVerificationCode: varchar('phone_verification_code', { length: 10 }),
  phoneVerificationCodeExpires: timestamp('phone_verification_code_expires'),
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

const paymentLinks = pgTable('payment_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('payment_links_merchant_id_idx').on(table.merchantId),
}));

const refunds = pgTable('refunds', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  transactionIdIdx: index('refunds_transaction_id_idx').on(table.transactionId),
  statusIdx: index('refunds_status_idx').on(table.status),
}));

const bulkPayments = pgTable('bulk_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  paymentCount: integer('payment_count').notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  description: text('description'),
  payments: text('payments').notNull(),
  successCount: integer('success_count').default(0),
  failureCount: integer('failure_count').default(0),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('bulk_payments_merchant_id_idx').on(table.merchantId),
  statusIdx: index('bulk_payments_status_idx').on(table.status),
}));

const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  customerIdIdx: index('payment_methods_customer_id_idx').on(table.customerId),
}));

const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull(),
  customerId: uuid('customer_id'),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  items: text('items').notNull(),
  notes: text('notes'),
  status: varchar('status', { length: 50 }).default('DRAFT').notNull(),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('invoices_merchant_id_idx').on(table.merchantId),
  customerIdIdx: index('invoices_customer_id_idx').on(table.customerId),
  statusIdx: index('invoices_status_idx').on(table.status),
  invoiceNumberIdx: index('invoices_invoice_number_idx').on(table.invoiceNumber),
}));

const qrCodes = pgTable('qr_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  qrCodeData: text('qr_code_data').notNull(),
  status: varchar('status', { length: 50 }).default('ACTIVE').notNull(),
  expiresAt: timestamp('expires_at'),
  scanCount: integer('scan_count').default(0).notNull(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('qr_codes_merchant_id_idx').on(table.merchantId),
  statusIdx: index('qr_codes_status_idx').on(table.status),
}));

const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull(),
  customerId: uuid('customer_id').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  interval: varchar('interval', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).default('ACTIVE').notNull(),
  nextBilling: timestamp('next_billing').notNull(),
  lastPayment: timestamp('last_payment'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('subscriptions_merchant_id_idx').on(table.merchantId),
  customerIdIdx: index('subscriptions_customer_id_idx').on(table.customerId),
  statusIdx: index('subscriptions_status_idx').on(table.status),
  nextBillingIdx: index('subscriptions_next_billing_idx').on(table.nextBilling),
}));

const splitPayments = pgTable('split_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  reference: varchar('reference', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  expiresAt: timestamp('expires_at'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('split_payments_merchant_id_idx').on(table.merchantId),
  statusIdx: index('split_payments_status_idx').on(table.status),
  referenceIdx: index('split_payments_reference_idx').on(table.reference),
}));

const splitPaymentParts = pgTable('split_payment_parts', {
  id: uuid('id').defaultRandom().primaryKey(),
  splitPaymentId: uuid('split_payment_id').notNull(),
  recipientId: uuid('recipient_id').notNull(),
  recipientType: varchar('recipient_type', { length: 50 }).default('MERCHANT').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  transactionId: uuid('transaction_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  splitPaymentIdIdx: index('split_payment_parts_split_payment_id_idx').on(table.splitPaymentId),
  recipientIdIdx: index('split_payment_parts_recipient_id_idx').on(table.recipientId),
  statusIdx: index('split_payment_parts_status_idx').on(table.status),
}));

const escrow = pgTable('escrow', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull(),
  customerId: uuid('customer_id').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  releaseCondition: text('release_condition'),
  reference: varchar('reference', { length: 255 }).notNull(),
  fundedAt: timestamp('funded_at'),
  releasedAt: timestamp('released_at'),
  refundedAt: timestamp('refunded_at'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('escrow_merchant_id_idx').on(table.merchantId),
  customerIdIdx: index('escrow_customer_id_idx').on(table.customerId),
  statusIdx: index('escrow_status_idx').on(table.status),
  referenceIdx: index('escrow_reference_idx').on(table.reference),
}));

const loyaltyAccounts = pgTable('loyalty_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  points: integer('points').default(0).notNull(),
  tier: varchar('tier', { length: 50 }).default('BRONZE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: uniqueIndex('loyalty_accounts_user_id_idx').on(table.userId),
}));

const loyaltyRewards = pgTable('loyalty_rewards', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  pointsRequired: integer('points_required').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

const loyaltyRedemptions = pgTable('loyalty_redemptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  loyaltyAccountId: uuid('loyalty_account_id').notNull(),
  rewardId: uuid('reward_id').notNull(),
  pointsUsed: integer('points_used').notNull(),
  status: varchar('status', { length: 50 }).default('COMPLETED').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  loyaltyAccountIdIdx: index('loyalty_redemptions_loyalty_account_id_idx').on(table.loyaltyAccountId),
  rewardIdIdx: index('loyalty_redemptions_reward_id_idx').on(table.rewardId),
}));

const promoCodes = pgTable('promo_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  discountType: varchar('discount_type', { length: 50 }).notNull(),
  discountValue: decimal('discount_value', { precision: 15, scale: 2 }).notNull(),
  minPurchase: decimal('min_purchase', { precision: 15, scale: 2 }).default('0').notNull(),
  maxUses: integer('max_uses'),
  usesCount: integer('uses_count').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  expiresAt: timestamp('expires_at'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('promo_codes_merchant_id_idx').on(table.merchantId),
  codeIdx: uniqueIndex('promo_codes_code_idx').on(table.code),
  activeIdx: index('promo_codes_active_idx').on(table.active),
}));

const referrals = pgTable('referrals', {
  id: uuid('id').defaultRandom().primaryKey(),
  referrerId: uuid('referrer_id').notNull(),
  referredUserId: uuid('referred_user_id'),
  referralCode: varchar('referral_code', { length: 50 }).notNull(),
  commissionRate: integer('commission_rate').default(5).notNull(),
  referredAt: timestamp('referred_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  referrerIdIdx: index('referrals_referrer_id_idx').on(table.referrerId),
  referredUserIdIdx: index('referrals_referred_user_id_idx').on(table.referredUserId),
  referralCodeIdx: uniqueIndex('referrals_referral_code_idx').on(table.referralCode),
}));

const supportTickets = pgTable('support_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  priority: varchar('priority', { length: 50 }).default('MEDIUM').notNull(),
  status: varchar('status', { length: 50 }).default('OPEN').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  customerIdIdx: index('support_tickets_customer_id_idx').on(table.customerId),
  statusIdx: index('support_tickets_status_idx').on(table.status),
}));

const settlements = pgTable('settlements', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('SLE').notNull(),
  mobileMoneyProvider: varchar('mobile_money_provider', { length: 50 }).notNull(),
  mobileNumber: varchar('mobile_number', { length: 50 }).notNull(),
  instant: boolean('instant').default(false).notNull(),
  instantFee: decimal('instant_fee', { precision: 15, scale: 2 }),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  settledAt: timestamp('settled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('settlements_merchant_id_idx').on(table.merchantId),
  statusIdx: index('settlements_status_idx').on(table.status),
  instantIdx: index('settlements_instant_idx').on(table.instant),
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
  paymentLinks,
  refunds,
  bulkPayments,
  paymentMethods,
  invoices,
  qrCodes,
  subscriptions,
  splitPayments,
  splitPaymentParts,
  escrow,
  loyaltyAccounts,
  loyaltyRewards,
  loyaltyRedemptions,
  promoCodes,
  referrals,
  supportTickets,
  settlements,
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

