// Runs around every integration test file: each test starts from an empty database with the Permissions and starting Roles.
import { sql } from 'drizzle-orm';
import { afterAll, beforeEach } from 'vitest';
import { client, db } from '#lib/server/db/index.ts';
import { ensureStartingRoles, syncPermissions } from '#lib/server/modules/members/index.ts';

async function emptyAllTables() {
	// The last line of defence: never empty a database that isn't a test database.
	const [current] = await client<{ name: string }[]>`select current_database() as name`;
	if (!current?.name.endsWith('_test')) {
		throw new Error(
			`Refusing to empty "${current?.name}": tests only run on a database ending in _test`
		);
	}
	const rows = await client<{ name: string }[]>`
		select tablename as name from pg_tables where schemaname = 'public'`;
	if (rows.length === 0) return;
	const list = rows.map(({ name }) => `"${name}"`).join(', ');
	await db.execute(sql.raw(`truncate table ${list} restart identity cascade`));
}

beforeEach(async () => {
	await emptyAllTables();
	await syncPermissions(db);
	await ensureStartingRoles(db);
});

afterAll(async () => {
	await client.end();
});
