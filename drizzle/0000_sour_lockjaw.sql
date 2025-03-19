CREATE TYPE "public"."Role" AS ENUM('SUPERADMIN', 'Manager', 'DOCTOR', 'USER');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(250) NOT NULL,
	"username" varchar(150),
	"password" varchar(255) NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"role" "Role" DEFAULT 'Manager' NOT NULL,
	"resetPasswordToken" varchar(255),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"deletedAt" timestamp (3),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
