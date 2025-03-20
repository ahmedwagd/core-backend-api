CREATE TABLE "clinics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"address" varchar(255),
	"manager" varchar(100),
	"email" varchar(100),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"deletedAt" timestamp (3),
	CONSTRAINT "clinics_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users_clinics" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"clinicId" integer NOT NULL,
	CONSTRAINT "users_clinics_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "users_clinics" ADD CONSTRAINT "users_clinics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_clinics" ADD CONSTRAINT "users_clinics_clinicId_clinics_id_fk" FOREIGN KEY ("clinicId") REFERENCES "public"."clinics"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "clinics_email_key" ON "clinics" USING btree ("email");