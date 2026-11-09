import { describe, expect, it } from 'vitest';
import { listActivity } from '#lib/server/modules/activity-log/index.ts';
import { signIn } from '#lib/server/modules/members/index.ts';
import { TEST_PASSWORD, addMember } from '../../../../support/members.ts';

const at = (iso: string) => ({ ip: '203.0.113.7', now: new Date(iso) });

/** Runs a sign-in and returns the error it was refused with, or null if it worked. */
async function refusal(promise: Promise<unknown>) {
	try {
		await promise;
		return null;
	} catch (error) {
		const { code, messageKey, params } = error as {
			code: string;
			messageKey: string;
			params?: unknown;
		};
		return { code, messageKey, params };
	}
}

describe('signIn', () => {
	it('signs in with the right password and returns the member and their language', async () => {
		const member = await addMember({ email: 'member@test.et', role: 'Member', language: 'en' });

		const result = await signIn(
			{ email: 'member@test.et', password: TEST_PASSWORD },
			at('2026-11-03T08:00:00Z')
		);

		expect(result).toEqual({ memberId: member.memberId, userId: member.userId, language: 'en' });
	});

	it('matches the email whatever the letter case', async () => {
		await addMember({ email: 'member@test.et', role: 'Member' });

		const result = await signIn(
			{ email: 'Member@Test.ET', password: TEST_PASSWORD },
			at('2026-11-03T08:00:00Z')
		);

		expect(result.language).toBe('am');
	});

	it.each([
		['a wrong password', 'member@test.et', 'not the password', true],
		['an unknown email', 'nobody@test.et', TEST_PASSWORD, true],
		['a switched-off account', 'member@test.et', TEST_PASSWORD, false]
	])(
		'refuses %s with the same message, so it never reveals who works here',
		async (_, email, password, active) => {
			await addMember({ email: 'member@test.et', role: 'Member', active });

			const error = await refusal(signIn({ email, password }, at('2026-11-03T08:00:00Z')));

			expect(error).toEqual({
				code: 'UNAUTHORIZED',
				messageKey: 'auth_error_wrong_credentials',
				params: undefined
			});
		}
	);

	describe('lockout', () => {
		const wrong = { email: 'member@test.et', password: 'not the password' };
		const right = { email: 'member@test.et', password: TEST_PASSWORD };
		const locked = (minutes: number) => ({
			code: 'RULE',
			messageKey: 'auth_error_account_locked',
			params: { minutes }
		});

		async function failTimes(times: number, iso: string) {
			for (let i = 0; i < times; i++) await refusal(signIn(wrong, at(iso)));
		}

		it('locks the account for a minute on the 5th wrong password, even against the right one', async () => {
			await addMember({ email: 'member@test.et', role: 'Member' });
			await failTimes(4, '2026-11-03T08:00:00Z');

			expect(await refusal(signIn(wrong, at('2026-11-03T08:00:00Z')))).toEqual(locked(1));
			expect(await refusal(signIn(right, at('2026-11-03T08:00:30Z')))).toEqual(locked(1));
		});

		it('opens again when the lock ends, and the next wrong password locks for twice as long', async () => {
			const member = await addMember({ email: 'member@test.et', role: 'Member' });
			await failTimes(5, '2026-11-03T08:00:00Z');

			expect(await refusal(signIn(wrong, at('2026-11-03T08:01:01Z')))).toEqual(locked(2));
			const result = await signIn(right, at('2026-11-03T08:03:02Z'));
			expect(result.memberId).toBe(member.memberId);
		});

		it('starts counting again after a successful sign-in', async () => {
			await addMember({ email: 'member@test.et', role: 'Member' });
			await failTimes(4, '2026-11-03T08:00:00Z');
			await signIn(right, at('2026-11-03T08:00:10Z'));

			await failTimes(3, '2026-11-03T08:00:20Z');
			expect(await refusal(signIn(wrong, at('2026-11-03T08:00:20Z')))).toEqual({
				code: 'UNAUTHORIZED',
				messageKey: 'auth_error_wrong_credentials',
				params: undefined
			});
		});
	});

	describe('rate limits', () => {
		const limited = {
			code: 'RATE_LIMITED',
			messageKey: 'common_error_rate_limited',
			params: undefined
		};
		const attempt = (email: string, ip: string, iso: string) =>
			refusal(signIn({ email, password: 'not the password' }, { ip, now: new Date(iso) }));

		it('refuses the 11th attempt in a minute from one IP, even with the right password', async () => {
			await addMember({ email: 'member@test.et', role: 'Member' });
			for (let i = 0; i < 10; i++)
				await attempt(`guess${i}@test.et`, '198.51.100.1', '2026-11-03T08:00:00Z');

			const error = await refusal(
				signIn(
					{ email: 'member@test.et', password: TEST_PASSWORD },
					{ ip: '198.51.100.1', now: new Date('2026-11-03T08:00:59Z') }
				)
			);

			expect(error).toEqual(limited);
		});

		it('refuses the 11th attempt in a minute on one email, whatever the IP', async () => {
			for (let i = 0; i < 10; i++)
				await attempt('member@test.et', `198.51.100.${i}`, '2026-11-03T08:00:00Z');

			expect(await attempt('CASHIER@test.et', '192.0.2.99', '2026-11-03T08:00:30Z')).toEqual(
				limited
			);
		});

		it('allows attempts again once the minute is over', async () => {
			await addMember({ email: 'member@test.et', role: 'Member' });
			for (let i = 0; i < 10; i++)
				await attempt(`guess${i}@test.et`, '198.51.100.1', '2026-11-03T08:00:00Z');

			const result = await signIn(
				{ email: 'member@test.et', password: TEST_PASSWORD },
				{ ip: '198.51.100.1', now: new Date('2026-11-03T08:01:00Z') }
			);

			expect(result.language).toBe('am');
		});
	});
});

describe('sign-in Activity log', () => {
	const events = async () =>
		(await listActivity()).items.map((e) => ({
			type: e.type,
			actor: e.actorMemberId,
			entity: e.entityId,
			ip: e.ip
		}));

	it('records a successful sign-in by the member', async () => {
		const member = await addMember({ email: 'member@test.et', role: 'Member' });
		await signIn({ email: 'member@test.et', password: TEST_PASSWORD }, at('2026-11-03T08:00:00Z'));

		expect(await events()).toEqual([
			{ type: 'auth.signed_in', actor: member.memberId, entity: member.memberId, ip: '203.0.113.7' }
		]);
	});

	it('records a failed sign-in with no actor, against the account when it exists', async () => {
		const member = await addMember({ email: 'member@test.et', role: 'Member' });
		await refusal(
			signIn({ email: 'member@test.et', password: 'wrong' }, at('2026-11-03T08:00:00Z'))
		);
		await refusal(
			signIn({ email: 'nobody@test.et', password: 'wrong' }, at('2026-11-03T08:00:01Z'))
		);

		expect(await events()).toEqual([
			{ type: 'auth.sign_in_failed', actor: null, entity: null, ip: '203.0.113.7' },
			{ type: 'auth.sign_in_failed', actor: null, entity: member.memberId, ip: '203.0.113.7' }
		]);
	});

	it('records the lock when the fifth wrong password locks the account', async () => {
		const member = await addMember({ email: 'member@test.et', role: 'Member' });
		for (let i = 0; i < 5; i++) {
			await refusal(
				signIn({ email: 'member@test.et', password: 'wrong' }, at('2026-11-03T08:00:00Z'))
			);
		}
		const [latest] = (await listActivity()).items;
		expect(latest).toMatchObject({
			type: 'auth.locked',
			entityId: member.memberId,
			after: { failedAttempts: 5, lockedUntil: '2026-11-03T08:01:00.000Z' }
		});
	});

	it('records a sign-in refused for too many attempts, with the IP and Device', async () => {
		for (let i = 0; i < 11; i++) {
			await refusal(signIn({ email: 'nobody@test.et', password: 'wrong' }, context));
		}
		const [latest] = (await listActivity()).items;
		expect(latest).toMatchObject({
			type: 'auth.rate_limited',
			actorMemberId: null,
			ip: '203.0.113.7',
			after: { by: 'ip' }
		});
	});
});
