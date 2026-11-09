import { describe, expect, it } from 'vitest';
import { listInput, pageOf } from '#lib/server/core/index.ts';

describe('listInput', () => {
	it('asks for 50 rows when no limit is given', () => {
		expect(listInput.parse({})).toEqual({ limit: 50 });
	});

	it('accepts a limit up to 200 and a cursor', () => {
		expect(listInput.parse({ limit: '200', cursor: 'abc' })).toEqual({ limit: 200, cursor: 'abc' });
	});

	it.each([0, 201, 2.5, -1])('rejects a limit of %s', (limit) => {
		expect(listInput.safeParse({ limit }).success).toBe(false);
	});
});

describe('pageOf', () => {
	const rows = [{ id: 'c' }, { id: 'b' }, { id: 'a' }];

	it('returns the cursor of the last row shown when there are more rows', () => {
		expect(pageOf(rows, 2, (r) => r.id)).toEqual({ items: rows.slice(0, 2), nextCursor: 'b' });
	});

	it('returns no cursor on the last page', () => {
		expect(pageOf(rows, 3, (r) => r.id)).toEqual({ items: rows, nextCursor: null });
	});
});
