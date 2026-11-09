import { desc, lt } from 'drizzle-orm';
import type { Executor } from '#lib/server/db/index.ts';
import { activityLog } from '#lib/server/db/schema/index.ts';
import type { ActivityEntry } from './activity-log.types.ts';

/** Adds one entry. The Activity log has no update or delete. */
export async function insertEntry(
	db: Executor,
	entry: typeof activityLog.$inferInsert
): Promise<void> {
	await db.insert(activityLog).values(entry);
}

/** Lists entries newest first, after the cursor id, fetching one extra to tell whether more exist. */
export function listEntries(
	db: Executor,
	page: { limit: number; cursor?: string }
): Promise<ActivityEntry[]> {
	return db
		.select({
			id: activityLog.id,
			createdAt: activityLog.createdAt,
			type: activityLog.eventType,
			actorMemberId: activityLog.actorMemberId,
			ip: activityLog.ip,
			entityType: activityLog.entityType,
			entityId: activityLog.entityId,
			before: activityLog.before,
			after: activityLog.after,
			reason: activityLog.reason,
		})
		.from(activityLog)
		.where(page.cursor ? lt(activityLog.id, page.cursor) : undefined)
		.orderBy(desc(activityLog.id))
		.limit(page.limit + 1);
}
