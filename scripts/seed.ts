// Fills a development database with Permissions, Roles and one demo account per Role.
// Safe to run again. Refuses to run in production.
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '#lib/server/db/schema/index.ts';
import { demoAccounts, seedDevDatabase } from '#lib/server/seed.ts';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

// A simple password for development only. Set SEED_PASSWORD to change it.
const password = process.env.SEED_PASSWORD ?? '12345678';

const client = postgres(url, { max: 1 });
const db = drizzle({ client, schema });

try {
	const { created } = await seedDevDatabase(db, { nodeEnv: process.env.NODE_ENV, password });
	console.log(
		created.length
			? `Seeded. Sign in as ${created.join(', ')} / ${password}`
			: `Nothing to add. Demo accounts: ${demoAccounts.map((a) => a.email).join(', ')}`
	);
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
} finally {
	await client.end();
}
