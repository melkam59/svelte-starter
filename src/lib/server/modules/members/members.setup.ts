// Setup steps for a new install. Imports nothing from SvelteKit, so plain Node scripts can run them.
import { randomUUID } from 'node:crypto';
import type { Executor } from '#lib/server/db/index.ts';
import {
	OWNER_ROLE_ID,
	permissionCodes,
	permissions,
	startingRoles
} from '#lib/shared/permissions.ts';
import * as repo from './members.repository.ts';

/** Copies the Permission list from code into the database. Adds and updates rows but never deletes them, so Roles keep their grants. */
export async function syncPermissions(db: Executor): Promise<void> {
	for (const [sort, code] of permissionCodes.entries()) {
		await repo.upsertPermission(db, { code, groupKey: permissions[code], sort });
	}
}

/** Creates the Owner, Manager and Cashier Roles if they are missing. Leaves existing Roles alone, so the Owner's changes survive. */
export async function ensureStartingRoles(db: Executor): Promise<void> {
	if (!(await repo.findRoleById(db, OWNER_ROLE_ID))) {
		await repo.insertRole(db, { id: OWNER_ROLE_ID, name: 'Owner' });
	}
	for (const starting of startingRoles) {
		if (await repo.findRoleByName(db, starting.name)) continue;
		const id = randomUUID();
		await repo.insertRole(db, { id, name: starting.name });
		await repo.insertRolePermissions(db, id, starting.permissions);
	}
}

/**
 * Adds a member with an email and password login, unless that email already has one.
 * Returns whether it added them. The password is hashed only when the account is new.
 */
export async function ensureMemberWithLogin(
	db: Executor,
	input: { email: string; name: string; role: string; hashPassword: () => Promise<string> }
): Promise<'created' | 'exists'> {
	if (await repo.findUserIdByEmail(db, input.email)) return 'exists';
	const roleId =
		input.role === 'Owner' ? OWNER_ROLE_ID : (await repo.findRoleByName(db, input.role))?.id;
	if (!roleId) throw new Error(`Role ${input.role} is missing`);
	const userId = randomUUID();
	await repo.insertCredentialUser(db, {
		userId,
		accountId: randomUUID(),
		name: input.name,
		email: input.email,
		passwordHash: await input.hashPassword()
	});
	await repo.insertMember(db, { id: randomUUID(), userId, roleId });
	return 'created';
}
