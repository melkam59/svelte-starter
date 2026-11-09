// Runs once before the integration tests: builds the test database from scratch with the checked-in migrations.
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { testDatabaseUrl } from './test-database.ts';

/** Drops and recreates the test database, then applies every migration. */
export default async function setup() {
	const configured = testDatabaseUrl();
	if (!configured)
		throw new Error('Set TEST_DATABASE_URL or DATABASE_URL to run integration tests');
	const url = new URL(configured);
	const name = url.pathname.slice(1);
	const server = new URL(url);
	server.pathname = '/postgres';

	const admin = postgres(server.toString(), { max: 1, onnotice: () => {} });
	try {
		await admin.unsafe(`drop database if exists "${name}" with (force)`);
		await admin.unsafe(`create database "${name}"`);
	} finally {
		await admin.end();
	}

	const client = postgres(url.toString(), { max: 1, onnotice: () => {} });
	try {
		await migrate(drizzle({ client }), { migrationsFolder: './drizzle' });
	} finally {
		await client.end();
	}
}
