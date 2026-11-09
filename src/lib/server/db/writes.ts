// Writes that follow the house rules: creates that are safe to repeat and edits that never overwrite someone else's.
import { and, eq, sql } from 'drizzle-orm';
import type { PgColumn, PgTable, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { Executor } from './index.ts';

/** Inserts a row unless one with the same key already exists. Returns whether this call created it. */
export async function insertOnce<T extends PgTable>(
	db: Executor,
	table: T,
	row: T['$inferInsert']
): Promise<'inserted' | 'exists'> {
	const inserted = await db.insert(table).values(row).onConflictDoNothing().returning();
	return inserted.length > 0 ? 'inserted' : 'exists';
}

type Versioned = PgTable & { id: PgColumn; version: PgColumn };

/** The outcome of an edit: saved, refused because someone saved first, or the row is gone. */
export type UpdateResult = 'updated' | 'stale' | 'missing';

/** Saves an edit only if the row is still at the version the editor started from, and adds one to the version. */
export async function updateVersioned<T extends Versioned>(
	db: Executor,
	table: T,
	target: { id: string; version: number },
	changes: PgUpdateSetSource<T>
): Promise<UpdateResult> {
	const set = { ...changes, version: sql`${table.version} + 1` } as PgUpdateSetSource<T>;
	const updated = await db
		.update(table)
		.set(set)
		.where(and(eq(table.id, target.id), eq(table.version, target.version)))
		.returning({ id: table.id });
	if (updated.length > 0) return 'updated';
	const [exists] = await db
		.select({ id: table.id })
		.from(table)
		.where(eq(table.id, target.id))
		.limit(1);
	return exists ? 'stale' : 'missing';
}
