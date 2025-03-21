DROP INDEX "clinics_email_key";--> statement-breakpoint
CREATE INDEX "clinics_id_index" ON "clinics" USING btree ("id");--> statement-breakpoint
CREATE INDEX "users_id_index" ON "users" USING btree ("id");