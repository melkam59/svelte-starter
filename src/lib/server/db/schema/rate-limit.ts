// Kept in Postgres so limits hold across several app processes without Redis.
import { index, integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { at } from '../columns.ts';

/** Counts attempts per key, such as sign-ins from one IP, to slow down guessing. */
export const rateLimit = pgTable(
	'rate_limit',
	{
		/** What is being counted, such as `sign-in:ip:<ip>`. */
		key: varchar('key', { length: 191 }).primaryKey(),
		hits: integer('hits').notNull(),
		windowStartedAt: at('window_started_at').notNull(),
		/** When the row is no longer needed and can be deleted. */
		expiresAt: at('expires_at').notNull()
	},
	(t) => [index('rate_limit_expires_idx').on(t.expiresAt)]
);
