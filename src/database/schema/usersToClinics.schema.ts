import {
  foreignKey,
  index,
  integer,
  pgTable,
  serial,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { clinics } from './clinics.schema';
import { relations } from 'drizzle-orm';

export const usersClinics = pgTable(
  'users_clinics',
  {
    id: serial('id').primaryKey(),
    userId: integer('userId').notNull(),
    clinicId: integer('clinicId').notNull(),
  },
  (table) => ({
    userIndex: index('users_clinics_user_id_index').on(table.userId),
    clinicIndex: index('users_clinics_clinic_id_index').on(table.clinicId),
    uniqueUserClinic: unique().on(table.userId, table.clinicId),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    })
      .onDelete('restrict') // Prevent deletion of users when a clinic is deleted
      .onUpdate('cascade'),
    clinicFk: foreignKey({
      columns: [table.clinicId],
      foreignColumns: [clinics.id],
    })
      .onDelete('cascade') // Automatically remove relations when a clinic is deleted
      .onUpdate('cascade'),
  }),
);

export const usersClinicsRelations = relations(usersClinics, ({ one }) => ({
  user: one(users, {
    fields: [usersClinics.userId],
    references: [users.id],
  }),
  clinic: one(clinics, {
    fields: [usersClinics.clinicId],
    references: [clinics.id],
  }),
}));
