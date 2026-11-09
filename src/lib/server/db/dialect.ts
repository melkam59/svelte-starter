// Every query Postgres writes differently from other databases lives here, behind a plain name.
// Switching databases means rewriting this file, not the repositories.
import { sql } from 'drizzle-orm';
import type { PgColumn, PgTable, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { Executor } from './index.ts';

/** Inserts a row, or updates the given columns if a row with the same key already exists. */
export async function upsert<T extends PgTable>(
	db: Executor,
	table: T,
	target: PgColumn | PgColumn[],
	row: T['$inferInsert'],
	update: PgUpdateSetSource<T>
): Promise<void> {
	await db.insert(table).values(row).onConflictDoUpdate({ target, set: update });
}

/** Runs the smallest possible query, to check the database answers. */
export async function ping(db: Executor): Promise<void> {
	await db.execute(sql`select 1`);
}
