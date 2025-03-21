import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { usersClinics } from './usersToClinics.schema';

export const clinics = pgTable(
  'clinics',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }).notNull(),
    address: varchar('address', { length: 255 }),
    manager: varchar('manager', { length: 100 }),
    email: varchar('email', { length: 100 }).unique(),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3 })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deletedAt', { precision: 3 }),
  },
  (table) => ({
    idIndex: index('clinics_id_index').on(table.id),
  }),
);

export const clinicsRelations = relations(clinics, ({ many }) => ({
  users: many(usersClinics),
  // patients: many(patients),
}));
