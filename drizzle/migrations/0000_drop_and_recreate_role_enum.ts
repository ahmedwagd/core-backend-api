import { pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const roleEnum = pgEnum('Role', [
  'SUPERADMIN',
  'MANAGER',
  'DOCTOR',
  'USER',
]);

export async function up(db: any) {
  // First remove the default constraint
  await db.execute(sql`ALTER TABLE users ALTER COLUMN role DROP DEFAULT`);
  // Drop the old enum
  await db.execute(sql`DROP TYPE IF EXISTS "Role"`);
  // Create new enum
  await db.execute(sql`CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'MANAGER', 'DOCTOR', 'USER')`);
  // Set the default back
  await db.execute(sql`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'USER'`);
}

export async function down(db: any) {
  await db.execute(sql`ALTER TABLE users ALTER COLUMN role DROP DEFAULT`);
} 