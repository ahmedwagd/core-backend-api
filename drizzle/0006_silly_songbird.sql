ALTER TABLE "clinics" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users_profiles" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users_profiles" ADD COLUMN "deletedAt" timestamp (3);