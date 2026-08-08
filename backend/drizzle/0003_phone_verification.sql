-- Add phone number and phone verification fields to users table
ALTER TABLE "users" ADD COLUMN "phone_number" varchar(20);
ALTER TABLE "users" ADD COLUMN "phone_verified" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN "phone_verification_code" varchar(10);
ALTER TABLE "users" ADD COLUMN "phone_verification_code_expires" timestamp;
