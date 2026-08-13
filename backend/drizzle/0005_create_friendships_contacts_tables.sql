-- Create contacts table
CREATE TABLE IF NOT EXISTS "contacts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "customer_id" uuid NOT NULL,
    "name" varchar(255) NOT NULL,
    "phone_number" varchar(20),
    "email" varchar(255),
    "is_paymi_user" boolean DEFAULT false NOT NULL,
    "matched_customer_id" uuid,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for contacts
CREATE INDEX IF NOT EXISTS "contacts_customer_id_idx" ON "contacts"("customer_id");
CREATE INDEX IF NOT EXISTS "contacts_phone_number_idx" ON "contacts"("phone_number");
CREATE INDEX IF NOT EXISTS "contacts_is_paymi_user_idx" ON "contacts"("is_paymi_user");

-- Add foreign key constraint for contacts
DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create friendships table
CREATE TABLE IF NOT EXISTS "friendships" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "requester_id" uuid NOT NULL,
    "receiver_id" uuid NOT NULL,
    "status" varchar(50) DEFAULT 'PENDING' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for friendships
CREATE INDEX IF NOT EXISTS "friendships_requester_id_idx" ON "friendships"("requester_id");
CREATE INDEX IF NOT EXISTS "friendships_receiver_id_idx" ON "friendships"("receiver_id");
CREATE INDEX IF NOT EXISTS "friendships_status_idx" ON "friendships"("status");
CREATE INDEX IF NOT EXISTS "friendships_unique_idx" ON "friendships"("requester_id", "receiver_id");

-- Add foreign key constraints for friendships
DO $$ BEGIN
 ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_customers_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "friendships" ADD CONSTRAINT "friendships_receiver_id_customers_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
