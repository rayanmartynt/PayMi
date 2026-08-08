CREATE TABLE IF NOT EXISTS "payment_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'SLE' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bulk_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'SLE' NOT NULL,
	"payment_count" integer NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"description" text,
	"payments" text NOT NULL,
	"success_count" integer DEFAULT 0,
	"failure_count" integer DEFAULT 0,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"customer_id" uuid,
	"invoice_number" varchar(50) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'SLE' NOT NULL,
	"items" text NOT NULL,
	"notes" text,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"due_date" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "qr_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"amount" numeric(15, 2),
	"currency" varchar(10) DEFAULT 'SLE' NOT NULL,
	"qr_code_data" text NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"expires_at" timestamp,
	"scan_count" integer DEFAULT 0 NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'SLE' NOT NULL,
	"interval" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"next_billing" timestamp NOT NULL,
	"last_payment" timestamp,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "split_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'SLE' NOT NULL,
	"reference" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "split_payment_parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"split_payment_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"recipient_type" varchar(50) DEFAULT 'MERCHANT' NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"transaction_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "escrow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'SLE' NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"release_condition" text,
	"reference" varchar(255) NOT NULL,
	"funded_at" timestamp,
	"released_at" timestamp,
	"refunded_at" timestamp,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"tier" varchar(50) DEFAULT 'BRONZE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"points_required" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loyalty_account_id" uuid NOT NULL,
	"reward_id" uuid NOT NULL,
	"points_used" integer NOT NULL,
	"status" varchar(50) DEFAULT 'COMPLETED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "promo_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"discount_type" varchar(50) NOT NULL,
	"discount_value" numeric(15, 2) NOT NULL,
	"min_purchase" numeric(15, 2) DEFAULT '0' NOT NULL,
	"max_uses" integer,
	"uses_count" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" uuid NOT NULL,
	"referred_user_id" uuid,
	"referral_code" varchar(50) NOT NULL,
	"commission_rate" integer DEFAULT 5 NOT NULL,
	"referred_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"subject" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"priority" varchar(50) DEFAULT 'MEDIUM' NOT NULL,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'SLE' NOT NULL,
	"mobile_money_provider" varchar(50) NOT NULL,
	"mobile_number" varchar(50) NOT NULL,
	"instant" boolean DEFAULT false NOT NULL,
	"instant_fee" numeric(15, 2),
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"settled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_transaction_reference_unique";--> statement-breakpoint
ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_key_unique";--> statement-breakpoint
ALTER TABLE "merchants" DROP CONSTRAINT "merchants_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_merchant_id_merchants_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "customer_transfers" DROP CONSTRAINT "customer_transfers_sender_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "customer_transfers" DROP CONSTRAINT "customer_transfers_receiver_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "customer_withdrawals" DROP CONSTRAINT "customer_withdrawals_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "withdrawals" DROP CONSTRAINT "withdrawals_merchant_id_merchants_id_fk";
--> statement-breakpoint
ALTER TABLE "kyc_documents" DROP CONSTRAINT "kyc_documents_merchant_id_merchants_id_fk";
--> statement-breakpoint
ALTER TABLE "kyc_documents" DROP CONSTRAINT "kyc_documents_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "customer_kyc_documents" DROP CONSTRAINT "customer_kyc_documents_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_merchant_id_merchants_id_fk";
--> statement-breakpoint
ALTER TABLE "webhooks" DROP CONSTRAINT "webhooks_merchant_id_merchants_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "customer_withdrawals_status_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "withdrawals_status_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "kyc_documents_customer_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "kyc_documents_status_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "customer_kyc_documents_status_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "api_keys_key_idx";--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "customer_transfers" ALTER COLUMN "status" SET DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "customer_withdrawals" ALTER COLUMN "status" SET DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "withdrawals" ALTER COLUMN "status" SET DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "kyc_documents" ALTER COLUMN "merchant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "webhooks" ALTER COLUMN "events" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "user_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "user_agent" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_number" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_code" varchar(10);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_code_expires" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_verification_code" varchar(10);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_verification_code_expires" timestamp;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "reference" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_transfers" ADD COLUMN "reference" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_transfers" ADD COLUMN "reversed_at" timestamp;--> statement-breakpoint
ALTER TABLE "customer_transfers" ADD COLUMN "reversal_reason" text;--> statement-breakpoint
ALTER TABLE "customer_withdrawals" ADD COLUMN "mobile_money_provider" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_withdrawals" ADD COLUMN "mobile_number" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "mobile_money_provider" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "mobile_number" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD COLUMN "document_url" varchar(500) NOT NULL;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD COLUMN "admin_comment" text;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD COLUMN "expiry_date" timestamp;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD COLUMN "submitted_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD COLUMN "metadata" text;--> statement-breakpoint
ALTER TABLE "customer_kyc_documents" ADD COLUMN "document_url" varchar(500) NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_kyc_documents" ADD COLUMN "admin_comment" text;--> statement-breakpoint
ALTER TABLE "customer_kyc_documents" ADD COLUMN "expiry_date" timestamp;--> statement-breakpoint
ALTER TABLE "customer_kyc_documents" ADD COLUMN "submitted_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_kyc_documents" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "customer_kyc_documents" ADD COLUMN "metadata" text;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "public_key" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "secret_key" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "webhook_secret" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "last_used" timestamp;--> statement-breakpoint
ALTER TABLE "webhooks" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "webhooks" ADD COLUMN "status" varchar(50) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "webhooks" ADD COLUMN "last_triggered" timestamp;--> statement-breakpoint
ALTER TABLE "webhooks" ADD COLUMN "success_rate" numeric(5, 2) DEFAULT '100' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "merchant_id" uuid;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_links_merchant_id_idx" ON "payment_links" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refunds_transaction_id_idx" ON "refunds" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refunds_status_idx" ON "refunds" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bulk_payments_merchant_id_idx" ON "bulk_payments" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bulk_payments_status_idx" ON "bulk_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_methods_customer_id_idx" ON "payment_methods" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_merchant_id_idx" ON "invoices" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_customer_id_idx" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_invoice_number_idx" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qr_codes_merchant_id_idx" ON "qr_codes" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qr_codes_status_idx" ON "qr_codes" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_merchant_id_idx" ON "subscriptions" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_customer_id_idx" ON "subscriptions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_next_billing_idx" ON "subscriptions" USING btree ("next_billing");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "split_payments_merchant_id_idx" ON "split_payments" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "split_payments_status_idx" ON "split_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "split_payments_reference_idx" ON "split_payments" USING btree ("reference");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "split_payment_parts_split_payment_id_idx" ON "split_payment_parts" USING btree ("split_payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "split_payment_parts_recipient_id_idx" ON "split_payment_parts" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "split_payment_parts_status_idx" ON "split_payment_parts" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "escrow_merchant_id_idx" ON "escrow" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "escrow_customer_id_idx" ON "escrow" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "escrow_status_idx" ON "escrow" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "escrow_reference_idx" ON "escrow" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "loyalty_accounts_user_id_idx" ON "loyalty_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_redemptions_loyalty_account_id_idx" ON "loyalty_redemptions" USING btree ("loyalty_account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_redemptions_reward_id_idx" ON "loyalty_redemptions" USING btree ("reward_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promo_codes_merchant_id_idx" ON "promo_codes" USING btree ("merchant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "promo_codes_code_idx" ON "promo_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promo_codes_active_idx" ON "promo_codes" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "referrals_referrer_id_idx" ON "referrals" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "referrals_referred_user_id_idx" ON "referrals" USING btree ("referred_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "referrals_referral_code_idx" ON "referrals" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "support_tickets_customer_id_idx" ON "support_tickets" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "support_tickets_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "settlements_merchant_id_idx" ON "settlements" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "settlements_status_idx" ON "settlements" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "settlements_instant_idx" ON "settlements" USING btree ("instant");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_created_at_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_merchant_id_idx" ON "notifications" USING btree ("merchant_id");--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "payment_gateway";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "transaction_reference";--> statement-breakpoint
ALTER TABLE "customer_withdrawals" DROP COLUMN IF EXISTS "phone_number";--> statement-breakpoint
ALTER TABLE "customer_withdrawals" DROP COLUMN IF EXISTS "payment_method";--> statement-breakpoint
ALTER TABLE "withdrawals" DROP COLUMN IF EXISTS "phone_number";--> statement-breakpoint
ALTER TABLE "withdrawals" DROP COLUMN IF EXISTS "payment_method";--> statement-breakpoint
ALTER TABLE "kyc_documents" DROP COLUMN IF EXISTS "customer_id";--> statement-breakpoint
ALTER TABLE "kyc_documents" DROP COLUMN IF EXISTS "document_number";--> statement-breakpoint
ALTER TABLE "kyc_documents" DROP COLUMN IF EXISTS "front_image_url";--> statement-breakpoint
ALTER TABLE "kyc_documents" DROP COLUMN IF EXISTS "back_image_url";--> statement-breakpoint
ALTER TABLE "kyc_documents" DROP COLUMN IF EXISTS "verified_at";--> statement-breakpoint
ALTER TABLE "customer_kyc_documents" DROP COLUMN IF EXISTS "document_number";--> statement-breakpoint
ALTER TABLE "customer_kyc_documents" DROP COLUMN IF EXISTS "front_image_url";--> statement-breakpoint
ALTER TABLE "customer_kyc_documents" DROP COLUMN IF EXISTS "back_image_url";--> statement-breakpoint
ALTER TABLE "customer_kyc_documents" DROP COLUMN IF EXISTS "verified_at";--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN IF EXISTS "key";--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN IF EXISTS "secret";--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN IF EXISTS "permissions";--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN IF EXISTS "last_used_at";--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN IF EXISTS "expires_at";--> statement-breakpoint
ALTER TABLE "webhooks" DROP COLUMN IF EXISTS "is_active";--> statement-breakpoint
ALTER TABLE "webhooks" DROP COLUMN IF EXISTS "last_triggered_at";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "metadata";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "device_info";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "ip_address";--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_reference_unique" UNIQUE("reference");--> statement-breakpoint
ALTER TABLE "customer_transfers" ADD CONSTRAINT "customer_transfers_reference_unique" UNIQUE("reference");--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_public_key_unique" UNIQUE("public_key");