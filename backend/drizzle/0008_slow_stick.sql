CREATE TABLE IF NOT EXISTS "messaging_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"email_alerts_enabled" boolean DEFAULT true NOT NULL,
	"sound_enabled" boolean DEFAULT true NOT NULL,
	"read_receipts_enabled" boolean DEFAULT true NOT NULL,
	"online_status_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messaging_settings_customer_id_idx" ON "messaging_settings" USING btree ("customer_id");