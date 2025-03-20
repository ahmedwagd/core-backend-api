import { foreignKey, integer, pgTable, serial } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { clinics } from './clinics.schema';
import { relations } from 'drizzle-orm';

export const usersClinics = pgTable(
  'users_clinics',
  {
    id: serial('id').primaryKey(),
    userId: integer('userId').notNull().unique(),
    clinicId: integer('clinicId').notNull(),
  },
  (table) => ({
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    clinicFk: foreignKey({
      columns: [table.clinicId],
      foreignColumns: [clinics.id],
    })
      .onDelete('restrict')
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
