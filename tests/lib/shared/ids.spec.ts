import { describe, expect, it } from 'vitest';
import { isId, newId } from '#lib/shared/ids.ts';

describe('newId', () => {
	it('makes a version 7 UUID', () => {
		expect(newId()).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
		);
	});

	it('sorts by creation time, so newer ids come later', () => {
		const older = newId(new Date('2026-11-03T08:00:00Z'));
		const newer = newId(new Date('2026-11-03T08:00:00.001Z'));
		expect(older < newer).toBe(true);
	});

	it('starts with the creation time in milliseconds', () => {
		expect(newId(new Date(0x0192_e5f0_0000)).slice(0, 13)).toBe('0192e5f0-0000');
	});

	it('keeps creation order for ids made in the same millisecond', () => {
		const at = new Date('2026-11-03T08:00:00Z');
		const ids = Array.from({ length: 50 }, () => newId(at));
		expect([...ids].sort()).toEqual(ids);
	});

	it('never repeats', () => {
		const ids = new Set(Array.from({ length: 1000 }, () => newId()));
		expect(ids.size).toBe(1000);
	});
});

describe('isId', () => {
	it('accepts any lowercase UUID and nothing else', () => {
		expect(isId(newId())).toBe(true);
		expect(isId('2b5e0f0e-2f7a-4d55-9b1f-0b8c7a1d2e3f')).toBe(true);
		expect(isId('not-an-id')).toBe(false);
		expect(isId('2B5E0F0E-2F7A-4D55-9B1F-0B8C7A1D2E3F')).toBe(false);
	});
});
