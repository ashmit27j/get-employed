ALTER TYPE "public"."search_frequency" ADD VALUE 'six-hourly' BEFORE 'daily';--> statement-breakpoint
ALTER TABLE "saved_searches" ADD COLUMN "run_on" text DEFAULT 'cloud' NOT NULL;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD COLUMN "notify" text DEFAULT 'each' NOT NULL;