import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { listActivity, record, recordLater } from '#lib/server/modules/activity-log/index.ts';
import { callerAs } from '../../../../support/callers.ts';

const entries = async () => (await listActivity()).items;

describe('Activity log', () => {
	it('stores when each entry happened to the millisecond', async () => {
		for (let i = 0; i < 3; i++) await recordLater({ type: 'test.tick', ip: '203.0.113.7' });
		const { items } = await listActivity();
		// Whole seconds would make every millisecond part zero; three in a row by chance is about one in a billion.
		expect(items.some((entry) => entry.createdAt.getMilliseconds() !== 0)).toBe(true);
	});

	it('keeps an entry whose transaction commits and drops one whose transaction rolls back', async () => {
		await db.transaction((tx) => record(tx, { type: 'test.kept', reason: 'committed' }));
		await expect(
			db.transaction(async (tx) => {
				await record(tx, { type: 'test.dropped' });
				throw new Error('the change failed');
			})
		).rejects.toThrow('the change failed');

		expect((await entries()).map((e) => e.type)).toEqual(['test.kept']);
	});

	it('stores who, where, what and the before and after', async () => {
		const member = await callerAs('Member');
		await db.transaction((tx) =>
			record(tx, {
				type: 'example.edited',
				actorMemberId: member.memberId,
				ip: '203.0.113.7',
				entity: { type: 'example_note', id: 'n1' },
				before: { body: 'old' },
				after: { body: 'new' }
			})
		);

		const [entry] = (await entries()).filter((e) => e.type === 'example.edited');
		expect(entry).toMatchObject({
			actorMemberId: member.memberId,
			ip: '203.0.113.7',
			entityType: 'example_note',
			entityId: 'n1',
			before: { body: 'old' },
			after: { body: 'new' }
		});
	});

	it('stores an anonymous event with no actor', async () => {
		await recordLater({ type: 'auth.sign_in_failed', ip: '203.0.113.7' });
		const [entry] = await entries();
		expect(entry).toMatchObject({ type: 'auth.sign_in_failed', actorMemberId: null });
	});

	it('never throws when a best-effort entry cannot be saved', async () => {
		await expect(recordLater({ type: 'x'.repeat(500) })).resolves.toBe(false);
	});

	it('lists entries newest first, a page at a time', async () => {
		for (let i = 1; i <= 3; i++) await recordLater({ type: `test.${i}` });
		const first = await listActivity({ limit: 2 });
		const second = await listActivity({ limit: 2, cursor: first.nextCursor! });
		expect([...first.items, ...second.items].map((e) => e.type)).toEqual([
			'test.3',
			'test.2',
			'test.1'
		]);
		expect(second.nextCursor).toBeNull();
	});
});

describe('app code', () => {
	function files(dir: string): string[] {
		return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
			e.isDirectory()
				? files(join(dir, e.name))
				: /\.(ts|svelte)$/.test(e.name)
					? [join(dir, e.name)]
					: []
		);
	}

	it('never updates or deletes Activity log entries', () => {
		const offenders = files('src').filter((file) =>
			/\.(update|delete)\(\s*activityLog\b|(update|delete from)\s+`?activity_log/i.test(
				readFileSync(file, 'utf8')
			)
		);
		expect(offenders).toEqual([]);
	});
});
