import { relations } from 'drizzle-orm';
import {
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const genderEnum = pgEnum('Gender', ['MALE', 'FEMALE']);

export const profiles = pgTable(
  'users_profiles',
  {
    id: serial('id').primaryKey(),
    firstName: varchar('firstName', { length: 50 }),
    lastName: varchar('lastName', { length: 50 }),
    phone: varchar('phone', { length: 50 }),
    birthday: timestamp('birthday', { precision: 3 }).notNull(),
    socialId: varchar('socialId', { length: 100 }).notNull(),
    license: varchar('license', { length: 255 }).unique(),
    specialization: varchar('specialization', { length: 150 }),
    bio: text('bio').notNull(),
    gender: genderEnum('gender').notNull(),
    userId: integer('userId').notNull().unique(),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
  },
  (table) => ({
    idIndex: index('users_profiles_id_key').on(table.id),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const usersProfilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  // schedules: many(schedules),
}));
