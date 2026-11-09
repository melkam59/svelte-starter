// Database queries for rate limits. Each takes the database client, so the same query works inside a transaction.
import { eq, sql } from 'drizzle-orm';
import { upsert } from '#lib/server/db/dialect.ts';
import type { Executor } from '#lib/server/db/index.ts';
import { rateLimit } from '#lib/server/db/schema/index.ts';

/** Counts one attempt for a key and returns the count in the current window. A window older than `windowStart` starts again at 1. */
export async function countAttempt(
	db: Executor,
	row: { key: string; now: Date; windowStart: Date; expiresAt: Date }
): Promise<number> {
	const expired = sql`${rateLimit.windowStartedAt} <= ${row.windowStart.toISOString()}::timestamptz`;
	await upsert(
		db,
		rateLimit,
		rateLimit.key,
		{ key: row.key, hits: 1, windowStartedAt: row.now, expiresAt: row.expiresAt },
		{
			// In Postgres every SET reads the old row, so both columns see the old window start.
			hits: sql`case when ${expired} then 1 else ${rateLimit.hits} + 1 end`,
			windowStartedAt: sql`case when ${expired} then ${row.now.toISOString()}::timestamptz else ${rateLimit.windowStartedAt} end`,
			expiresAt: row.expiresAt
		}
	);
	const [counted] = await db
		.select({ hits: rateLimit.hits })
		.from(rateLimit)
		.where(eq(rateLimit.key, row.key))
		.limit(1);
	return counted?.hits ?? 1;
}
