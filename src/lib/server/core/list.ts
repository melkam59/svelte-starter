import { z } from 'zod';

/** A record id made by the screen: a version 7 UUID, which also sorts by when it was made. */
export const idInput = z.uuid({ version: 'v7', error: 'common_error_invalid_id' });

/** The input every list takes: how many rows (50 unless asked, at most 200) and where the last page stopped. */
export const listInput = z.object({
	limit: z.coerce.number().int().min(1).max(200).default(50),
	cursor: z.string().min(1).max(64).optional()
});

export type ListInput = z.output<typeof listInput>;

/** One page of a list, with the cursor to ask for the next page, or null on the last page. */
export interface Page<T> {
	items: T[];
	nextCursor: string | null;
}

/** Turns rows fetched with one more than the limit into a page. The extra row only says whether another page exists. */
export function pageOf<T>(rows: T[], limit: number, cursorOf: (row: T) => string): Page<T> {
	const items = rows.slice(0, limit);
	const more = rows.length > limit;
	return { items, nextCursor: more ? cursorOf(items[items.length - 1]!) : null };
}
