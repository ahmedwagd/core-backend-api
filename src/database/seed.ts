import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/schema';
import { faker } from '@faker-js/faker';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: true,
});

const db = drizzle(pool, { schema });

async function main() {
  await Promise.all(
    Array(50)
      .fill('')
      .map(async () => {
        const user = await db
          .insert(schema.users)
          .values({
            email: faker.internet.email(),
            username: faker.internet.username(),
            password: '12345678',
            // name: faker.person.firstName() + ' ' + faker.person.lastName(),
          })
          .returning();

        return user[0].id;
      }),
  );
}

main()
  .then(() => console.log('Seed complete'))
  .catch((err) => {
    console.error(err);
    process.exit(0);
  });
