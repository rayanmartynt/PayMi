ALTER TABLE "chats" ALTER COLUMN "participant_2_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "type" varchar(20) DEFAULT 'customer' NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "transaction_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "status" varchar(20) DEFAULT 'sent' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "edited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chats_type_idx" ON "chats" USING btree ("type");