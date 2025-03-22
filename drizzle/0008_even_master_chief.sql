ALTER TABLE "users_clinics" DROP CONSTRAINT "users_clinics_clinicId_clinics_id_fk";
--> statement-breakpoint
ALTER TABLE "users_clinics" ADD CONSTRAINT "users_clinics_clinicId_clinics_id_fk" FOREIGN KEY ("clinicId") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE cascade;