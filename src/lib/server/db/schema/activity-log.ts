// The Activity log: one row per thing that happened. Rows are only ever added.
import { index, jsonb, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { createdAtColumn, idColumn } from '../columns.ts';
import { member } from './members.ts';

/** Who did what, when, from where, and what it looked like before and after. */
export const activityLog = pgTable(
	'activity_log',
	{
		id: idColumn().primaryKey(),
		createdAt: createdAtColumn(),
		/** What happened, such as `auth.signed_in` or `role.permission_changed`. */
		eventType: varchar('event_type', { length: 64 }).notNull(),
		/** The member who did it; empty for anonymous events such as a failed sign-in. */
		actorMemberId: uuid('actor_member_id').references(() => member.id, { onDelete: 'restrict' }),
		ip: varchar('ip', { length: 45 }),
		entityType: varchar('entity_type', { length: 32 }),
		entityId: varchar('entity_id', { length: 64 }),
		before: jsonb('before'),
		after: jsonb('after'),
		reason: varchar('reason', { length: 500 })
	},
	(t) => [
		index('activity_log_created_idx').on(t.createdAt),
		index('activity_log_entity_idx').on(t.entityType, t.entityId),
		index('activity_log_event_idx').on(t.eventType)
	]
);
