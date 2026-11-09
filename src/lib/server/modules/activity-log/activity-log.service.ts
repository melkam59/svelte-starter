// The Activity log records who did what. `record` writes inside the caller's transaction, so the entry
// exists only if the change does. `recordLater` is for events with no transaction and never fails the caller.
// The member module writes here (sign-ins, refused Permissions), so this module never imports it.
import { createLogger, pageOf, type ListInput, type Page } from '#lib/server/core/index.ts';
import { db, type Executor } from '#lib/server/db/index.ts';
import { newId } from '#lib/shared/ids.ts';
import * as repo from './activity-log.repository.ts';
import { listActivityInput } from './activity-log.schema.ts';
import type { ActivityEntry, ActivityEvent } from './activity-log.types.ts';

const log = createLogger('activity-log');

function row(event: ActivityEvent) {
	return {
		id: newId(),
		eventType: event.type,
		actorMemberId: event.actorMemberId ?? null,
		ip: event.ip ?? null,
		entityType: event.entity?.type ?? null,
		entityId: event.entity?.id ?? null,
		before: event.before ?? null,
		after: event.after ?? null,
		reason: event.reason ?? null,
	};
}

/** Adds an entry inside a transaction. If the transaction rolls back, so does the entry. */
export async function record(tx: Executor, event: ActivityEvent): Promise<void> {
	await repo.insertEntry(tx, row(event));
}

/** Adds an entry on its own, best effort. A failure is logged and returns false; it never throws. */
export async function recordLater(event: ActivityEvent): Promise<boolean> {
	try {
		await repo.insertEntry(db, row(event));
		return true;
	} catch (err) {
		log.error({ err, event: event.type.slice(0, 64) }, 'could not write Activity log entry');
		return false;
	}
}

/** Lists the Activity log, newest first, one page at a time. It checks no Permission: the screen's procedure requires `audit:read`. */
export async function listActivity(input: Partial<ListInput> = {}): Promise<Page<ActivityEntry>> {
	const page = listActivityInput.parse(input);
	return pageOf(await repo.listEntries(db, page), page.limit, (entry) => entry.id);
}
