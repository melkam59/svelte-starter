import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { devOnly, procedure } from '#lib/server/modules/members/index.ts';
import { callerAs } from '../../../../support/callers.ts';

const echo = procedure('test.echo', {
	access: 'signed-in',
	input: z.object({ n: z.number() }),
	run: async (input) => input
});

describe('procedures', () => {
	it('tells an anonymous caller to sign in before looking at their input', async () => {
		const anonymous = await callerAs('anonymous');
		await expect(anonymous.call(echo, { n: 'not a number' } as never)).rejects.toMatchObject({
			code: 'UNAUTHORIZED'
		});
	});

	it('still checks the input of a signed-in caller', async () => {
		const member = await callerAs('Member');
		await expect(member.call(echo, { n: 'not a number' } as never)).rejects.toMatchObject({
			code: 'VALIDATION'
		});
	});

	it('a development-only procedure is not found outside development', async () => {
		const owner = await callerAs('Owner');
		await expect(owner.call(devOnly(echo, false), { n: 1 })).rejects.toMatchObject({
			code: 'NOT_FOUND'
		});
		expect(await owner.call(devOnly(echo, true), { n: 1 })).toEqual({ n: 1 });
	});
});
