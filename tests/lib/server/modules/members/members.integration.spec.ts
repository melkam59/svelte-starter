import { describe, expect, it } from 'vitest';
import {
	callProcedure,
	can,
	currentMember,
	saveMyLanguage,
	signIn
} from '#lib/server/modules/members/index.ts';
import { TEST_PASSWORD, addMember } from '../../../../support/members.ts';

describe('test database', () => {
	it('starts every test empty', async () => {
		expect(await currentMember('no-such-user')).toBeNull();
	});

	it('finds a member added in the test, with their Role', async () => {
		const member = await addMember({ email: 'member@test.et', role: 'Member' });

		const me = await currentMember(member.userId);

		expect(me).toMatchObject({ email: 'member@test.et', roleName: 'Member', isOwner: false });
		expect(me?.permissions.has('note:write')).toBe(true);
	});

	it('does not keep rows from the previous test', async () => {
		await addMember({ email: 'member@test.et', role: 'Member' });
		expect(await currentMember('no-such-user')).toBeNull();
	});
});

describe('Permissions', () => {
	it('gives the Owner every Permission and a Member only the Member ones', async () => {
		const owner = await addMember({ email: 'owner@test.et', role: 'Owner' });
		const member = await addMember({ email: 'member@test.et', role: 'Member' });

		const ownerMe = await currentMember(owner.userId);
		const memberMe = await currentMember(member.userId);

		expect(can(ownerMe!, 'user:manage')).toBe(true);
		expect(can(memberMe!, 'note:write')).toBe(true);
		expect(can(memberMe!, 'user:manage')).toBe(false);
	});

	it('treats a switched-off member as not signed in', async () => {
		const member = await addMember({ email: 'member@test.et', role: 'Member', active: false });
		expect(await currentMember(member.userId)).toBeNull();
	});
});

describe('saveMyLanguage', () => {
	it("is used on the member's next sign-in", async () => {
		const member = await addMember({ email: 'member@test.et', role: 'Member', language: 'am' });

		await callProcedure(
			saveMyLanguage,
			'en'
		);
		const result = await signIn(
			{ email: 'member@test.et', password: TEST_PASSWORD },
			{ ip: '203.0.113.7' }
		);

		expect(result.language).toBe('en');
	});
});
