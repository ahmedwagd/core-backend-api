ALTER TABLE "public"."users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."Role";--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('SUPERADMIN', 'MANAGER', 'DOCTOR', 'USER');--> statement-breakpoint
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DATA TYPE "public"."Role" USING "role"::"public"."Role";
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DEFAULT 'USER';