CREATE TYPE "public"."Gender" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TABLE "users_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"firstName" varchar(50),
	"lastName" varchar(50),
	"phone" varchar(50),
	"birthday" timestamp (3) NOT NULL,
	"socialId" varchar(100) NOT NULL,
	"license" varchar(255),
	"specialization" varchar(150),
	"bio" text NOT NULL,
	"gender" "Gender" NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	CONSTRAINT "users_profiles_license_unique" UNIQUE("license"),
	CONSTRAINT "users_profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "users_profiles" ADD CONSTRAINT "users_profiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "users_profiles_id_key" ON "users_profiles" USING btree ("id");