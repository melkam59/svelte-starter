import { db } from '#lib/server/db/index.ts';
import * as repo from './rate-limits.repository.ts';

/** How many attempts a key gets, and over how long. */
export interface Limit {
	attempts: number;
	windowMs: number;
}

/** The default limit: 10 attempts a minute. */
export const perMinute: Limit = { attempts: 10, windowMs: 60_000 };

/** Counts an attempt for a key, such as sign-ins from one IP, and returns whether it is still within the limit. */
export async function allowAttempt(
	key: string,
	now = new Date(),
	limit = perMinute
): Promise<boolean> {
	const windowStart = new Date(now.getTime() - limit.windowMs);
	const expiresAt = new Date(now.getTime() + limit.windowMs);
	const hits = await db.transaction((tx) =>
		repo.countAttempt(tx, { key, now, windowStart, expiresAt })
	);
	return hits <= limit.attempts;
}
