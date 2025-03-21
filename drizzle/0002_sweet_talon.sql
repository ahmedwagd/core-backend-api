CREATE INDEX "users_clinics_user_id_index" ON "users_clinics" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "users_clinics_clinic_id_index" ON "users_clinics" USING btree ("clinicId");