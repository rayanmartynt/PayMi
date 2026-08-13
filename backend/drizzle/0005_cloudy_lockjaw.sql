ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_phone_number_idx" ON "users" USING btree ("phone_number");