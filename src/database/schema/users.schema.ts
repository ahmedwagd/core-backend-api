import {
  boolean,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
// import { relations } from 'drizzle-orm';

export const roleEnum = pgEnum('Role', [
  'SUPERADMIN',
  'MANAGER',
  'DOCTOR',
  'USER',
]);

// Tables
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 250 }).notNull().unique(),
  username: varchar('username', { length: 150 }).unique(),
  password: varchar('password', { length: 255 }).notNull(),
  isVerified: boolean('is_verified').notNull().default(false),
  verificationToken: varchar('verificationToken', { length: 255 }),
  userType: roleEnum('role').notNull().default('USER'),
  resetPasswordToken: varchar('resetPasswordToken', { length: 255 }),
  createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3 })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp('deletedAt', { precision: 3 }),
});
