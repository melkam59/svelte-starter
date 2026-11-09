import { describe, expect, it } from 'vitest';
import { listActivity } from '#lib/server/modules/activity-log/index.ts';
import { listNotes } from '#lib/server/modules/example/index.ts';
import { listRoles, procedure, setRolePermission } from '#lib/server/modules/members/index.ts';
import { OWNER_ROLE_ID } from '#lib/shared/permissions.ts';
import { z } from 'zod';
import { callerAs } from '../../../../support/callers.ts';

const needsSettings = procedure('test.settings', {
	access: 'settings:manage',
	input: z.object({}),
	run: async () => 'secret numbers'
});

const roleNamed = async (name: string) => {
	const owner = await callerAs('Owner');
	return (await owner.call(listRoles, {})).items.find((r) => r.name === name)!;
};

describe('Permission checks', () => {
	it('refuses a caller with no session', async () => {
		const anonymous = await callerAs('anonymous');
		await expect(anonymous.call(listNotes, {})).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
	});

	it('refuses a missing Permission and records the refusal', async () => {
		const member = await callerAs('Member');
		await expect(member.call(needsSettings, {})).rejects.toMatchObject({ code: 'FORBIDDEN' });

		const [entry] = (await listActivity()).items;
		expect(entry).toMatchObject({
			type: 'authz.denied',
			actorMemberId: member.memberId,
			after: { procedure: 'test.settings', needs: 'settings:manage' }
		});
	});

	it('lets the Owner do everything', async () => {
		const owner = await callerAs('Owner');
		await expect(owner.call(needsSettings, {})).resolves.toBe('secret numbers');
	});

	it('starts Admins without settings access', async () => {
		const admin = await roleNamed('Admin');
		expect(admin.permissions).not.toContain('settings:manage');
		expect(admin.permissions).not.toContain('settings:manage');
		expect(admin.permissions).toContain('stock:adjust');
	});
});

describe('Role Permissions', () => {
	it('lists Roles by name, one page at a time', async () => {
		const owner = await callerAs('Owner');
		const first = await owner.call(listRoles, { limit: 2 });
		expect(first.items.map((r) => r.name)).toEqual(['Member', 'Admin']);
		expect(first.nextCursor).toBe('Admin');

		const second = await owner.call(listRoles, { limit: 2, cursor: first.nextCursor! });
		expect(second.items.map((r) => r.name)).toEqual(['Owner']);
		expect(second.nextCursor).toBeNull();
	});

	it('lists the Owner Role as holding everything and not editable', async () => {
		const owner = await roleNamed('Owner');
		expect(owner).toMatchObject({ id: OWNER_ROLE_ID, isEditable: false });
		expect(owner.permissions).toContain('settings:manage');
	});

	it('takes effect on the next request and records before and after', async () => {
		const owner = await callerAs('Owner');
		const member = await callerAs('Member');
		const memberRole = await roleNamed('Member');

		await owner.call(setRolePermission, {
			roleId: memberRole.id,
			code: 'settings:manage',
			granted: true
		});
		await expect(member.call(needsSettings, {})).resolves.toBe('secret numbers');

		await owner.call(setRolePermission, {
			roleId: memberRole.id,
			code: 'settings:manage',
			granted: false
		});
		await expect(member.call(needsSettings, {})).rejects.toMatchObject({ code: 'FORBIDDEN' });

		const changes = (await listActivity()).items.filter(
			(e) => e.type === 'role.permission_changed'
		);
		expect(changes[0]).toMatchObject({
			entityId: memberRole.id,
			before: { granted: true },
			after: { granted: false },
			reason: 'settings:manage'
		});
	});

	it('only lets the Owner change Role Permissions', async () => {
		const admin = await callerAs('Admin');
		const role = await roleNamed('Admin');
		await expect(
			admin.call(setRolePermission, { roleId: role.id, code: 'settings:manage', granted: true })
		).rejects.toMatchObject({ code: 'FORBIDDEN' });
	});

	it('refuses to edit the Owner Role, an unknown Role or an unknown Permission', async () => {
		const owner = await callerAs('Owner');
		const memberRole = await roleNamed('Member');
		await expect(
			owner.call(setRolePermission, { roleId: OWNER_ROLE_ID, code: 'note:write', granted: false })
		).rejects.toMatchObject({ code: 'RULE', messageKey: 'members_error_owner_role_fixed' });
		await expect(
			owner.call(setRolePermission, { roleId: 'no-such-role', code: 'note:write', granted: true })
		).rejects.toMatchObject({ code: 'NOT_FOUND' });
		await expect(
			owner.call(setRolePermission, {
				roleId: memberRole.id,
				code: 'teleport:anywhere' as 'note:write',
				granted: true
			})
		).rejects.toMatchObject({ code: 'VALIDATION', fieldErrors: { code: expect.any(Array) } });
	});
});
