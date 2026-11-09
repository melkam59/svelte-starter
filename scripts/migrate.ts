// Applies the checked-in migrations to DATABASE_URL. The same migrator builds the test database,
// so local, tests and deploy all migrate the same way.
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const client = postgres(url, { max: 1, onnotice: () => {} });
try {
	await migrate(drizzle({ client }), { migrationsFolder: './drizzle' });
	console.log('Migrations applied.');
} finally {
	await client.end();
}
