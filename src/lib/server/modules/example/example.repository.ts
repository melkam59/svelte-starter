import { desc, eq, lt } from 'drizzle-orm';
import type { Executor } from '#lib/server/db/index.ts';
import { exampleNote, member, user } from '#lib/server/db/schema/index.ts';
import { insertOnce, updateVersioned } from '#lib/server/db/writes.ts';

/** Saves a new note unless one with the same id exists. */
export function insertNote(
	db: Executor,
	note: { id: string; body: string; authorMemberId: string }
) {
	return insertOnce(db, exampleNote, note);
}

/** Saves a note's new text if it is still at the given version. */
export function updateNote(db: Executor, target: { id: string; version: number }, body: string) {
	return updateVersioned(db, exampleNote, target, { body });
}

/** Lists notes newest first, starting after the cursor id. Fetches one extra row to tell whether more exist. */
export function listNotes(db: Executor, page: { limit: number; cursor?: string }) {
	return db
		.select({
			id: exampleNote.id,
			body: exampleNote.body,
			version: exampleNote.version,
			authorName: user.name,
			createdAt: exampleNote.createdAt
		})
		.from(exampleNote)
		.innerJoin(member, eq(member.id, exampleNote.authorMemberId))
		.innerJoin(user, eq(user.id, member.userId))
		.where(page.cursor ? lt(exampleNote.id, page.cursor) : undefined)
		.orderBy(desc(exampleNote.id))
		.limit(page.limit + 1);
}
