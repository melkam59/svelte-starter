import { describe, expect, it } from 'vitest';
import { lockFor } from '#lib/server/modules/members/index.ts';

const minute = 60_000;

describe('lockFor', () => {
	it.each([
		[0, 0],
		[1, 0],
		[4, 0],
		[5, 1 * minute],
		[6, 2 * minute],
		[7, 4 * minute],
		[9, 16 * minute],
		[10, 30 * minute],
		[50, 30 * minute]
	])('locks for the right time after %i wrong attempts', (failures, lock) => {
		expect(lockFor(failures)).toBe(lock);
	});
});
