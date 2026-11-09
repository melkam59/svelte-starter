import { describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { can, currentMember, signIn } from '#lib/server/modules/members/index.ts';
import { seedDevDatabase } from '#lib/server/seed.ts';
import { startingRoles } from '#lib/shared/permissions.ts';

const context = { ip: '203.0.113.7' };
const password = 'dev-pass-1234';

async function signedInAs(email: string) {
	const { userId } = await signIn({ email, password }, context);
	return (await currentMember(userId))!;
}

describe('seedDevDatabase', () => {
	it('refuses to run in production and writes nothing', async () => {
		await expect(seedDevDatabase(db, { nodeEnv: 'production', password })).rejects.toThrow(
			/production/
		);
		await expect(signIn({ email: 'owner@demo.com', password }, context)).rejects.toMatchObject({
			code: 'UNAUTHORIZED'
		});
	});

	it('creates an Owner, an Admin and a Member who resolve to their Roles and Permissions', async () => {
		await seedDevDatabase(db, { nodeEnv: 'development', password });

		const owner = await signedInAs('owner@demo.com');
		expect(owner.isOwner).toBe(true);
		expect(can(owner, 'settings:manage')).toBe(true);

		const admin = await signedInAs('admin@demo.com');
		expect(admin.roleName).toBe('Admin');
		const adminDefaults = startingRoles.find((role) => role.name === 'Admin')!.permissions;
		expect([...admin.permissions].sort()).toEqual([...adminDefaults].sort());

		const member = await signedInAs('member@demo.com');
		expect(member.roleName).toBe('Member');
		expect(can(member, 'note:write')).toBe(true);
		expect(can(member, 'settings:manage')).toBe(false);
	});


	it('changes nothing when run a second time', async () => {
		const first = await seedDevDatabase(db, { nodeEnv: 'development', password });
		const owner = await signedInAs('owner@demo.com');

		const second = await seedDevDatabase(db, { nodeEnv: 'development', password: 'another-pass' });

		expect(first.created).toEqual(['owner@demo.com', 'admin@demo.com', 'member@demo.com']);
		expect(second.created).toEqual([]);
		expect(await signedInAs('owner@demo.com')).toEqual(owner);
	});
});
