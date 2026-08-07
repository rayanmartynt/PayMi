CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "merchants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"business_type" varchar(50) NOT NULL,
	"business_email" varchar(255),
	"phone_number" varchar(20),
	"business_address" varchar(500),
	"profile_picture" varchar(500),
	"balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"kyc_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"address" varchar(500),
	"profile_picture" varchar(500),
	"balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"kyc_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"customer_id" uuid,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'SLE' NOT NULL,
	"status" varchar(50) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"payment_gateway" varchar(50),
	"transaction_reference" varchar(255),
	"description" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_transaction_reference_unique" UNIQUE("transaction_reference")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"fee" numeric(15, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(10) DEFAULT 'SLE' NOT NULL,
	"status" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_withdrawals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"fee" numeric(15, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(10) DEFAULT 'SLE' NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"rejection_reason" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "withdrawals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"fee" numeric(15, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(10) DEFAULT 'SLE' NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"rejection_reason" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyc_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid,
	"customer_id" uuid,
	"document_type" varchar(50) NOT NULL,
	"document_number" varchar(100),
	"front_image_url" varchar(500),
	"back_image_url" varchar(500),
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_kyc_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"document_number" varchar(100),
	"front_image_url" varchar(500),
	"back_image_url" varchar(500),
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"key" varchar(255) NOT NULL,
	"secret" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"permissions" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"secret" varchar(255) NOT NULL,
	"events" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_triggered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"device_info" text,
	"ip_address" varchar(50),
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_fees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"fee" numeric(15, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'SLE' NOT NULL,
	"reference_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"transaction_id" uuid,
	"transfer_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"resolution" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "merchants" ADD CONSTRAINT "merchants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_transfers" ADD CONSTRAINT "customer_transfers_sender_id_customers_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_transfers" ADD CONSTRAINT "customer_transfers_receiver_id_customers_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_withdrawals" ADD CONSTRAINT "customer_withdrawals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_kyc_documents" ADD CONSTRAINT "customer_kyc_documents_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchants_user_id_idx" ON "merchants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_user_id_idx" ON "customers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_merchant_id_idx" ON "transactions" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_customer_id_idx" ON "transactions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_transfers_sender_id_idx" ON "customer_transfers" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_transfers_receiver_id_idx" ON "customer_transfers" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_transfers_status_idx" ON "customer_transfers" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_withdrawals_customer_id_idx" ON "customer_withdrawals" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_withdrawals_status_idx" ON "customer_withdrawals" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "withdrawals_merchant_id_idx" ON "withdrawals" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "withdrawals_status_idx" ON "withdrawals" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kyc_documents_merchant_id_idx" ON "kyc_documents" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kyc_documents_customer_id_idx" ON "kyc_documents" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kyc_documents_status_idx" ON "kyc_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_kyc_documents_customer_id_idx" ON "customer_kyc_documents" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_kyc_documents_status_idx" ON "customer_kyc_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_merchant_id_idx" ON "api_keys" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_key_idx" ON "api_keys" USING btree ("key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhooks_merchant_id_idx" ON "webhooks" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_token_idx" ON "refresh_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_fees_type_idx" ON "admin_fees" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_fees_created_at_idx" ON "admin_fees" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "disputes_customer_id_idx" ON "disputes" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "disputes_status_idx" ON "disputes" USING btree ("status");