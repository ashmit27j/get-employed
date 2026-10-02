ALTER TABLE "saved_searches" ALTER COLUMN "frequency" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "saved_searches" ALTER COLUMN "frequency" SET DEFAULT 'daily'::text;--> statement-breakpoint
UPDATE "saved_searches" SET "frequency" = CASE "frequency" WHEN 'hourly' THEN 'four-hourly' WHEN 'six-hourly' THEN 'eight-hourly' WHEN 'weekly' THEN 'daily' ELSE "frequency" END;--> statement-breakpoint
DROP TYPE "public"."search_frequency";--> statement-breakpoint
CREATE TYPE "public"."search_frequency" AS ENUM('four-hourly', 'eight-hourly', 'daily');--> statement-breakpoint
ALTER TABLE "saved_searches" ALTER COLUMN "frequency" SET DEFAULT 'daily'::"public"."search_frequency";--> statement-breakpoint
ALTER TABLE "saved_searches" ALTER COLUMN "frequency" SET DATA TYPE "public"."search_frequency" USING "frequency"::"public"."search_frequency";