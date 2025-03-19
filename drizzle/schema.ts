import { pgTable, uniqueIndex, unique, check, serial, varchar, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const role = pgEnum("Role", ['SUPERADMIN', 'MANAGER', 'DOCTOR', 'USER'])


export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 250 }).notNull(),
	username: varchar({ length: 150 }),
	password: varchar({ length: 255 }).notNull(),
	isVerified: boolean("is_verified").default(false).notNull(),
	role: role().default('USER').notNull(),
	resetPasswordToken: varchar({ length: 255 }),
	createdAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	uniqueIndex("users_email_unique_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	uniqueIndex("users_username_unique_idx").using("btree", table.username.asc().nullsLast().op("text_ops")),
	unique("users_email_unique").on(table.email),
	unique("users_username_unique").on(table.username),
	check("valid_role", sql`role IS NOT NULL`),
]);
