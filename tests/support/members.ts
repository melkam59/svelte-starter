// Adds members straight into the test database, the way the seed script does.
import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { db } from '#lib/server/db/index.ts';
import * as repo from '#lib/server/modules/members/members.repository.ts';
import { OWNER_ROLE_ID } from '#lib/shared/permissions.ts';
import type { Locale } from '#lib/paraglide/runtime.js';

const hashes = new Map<string, Promise<string>>();

/** Hashes a password once per test run, because hashing is slow on purpose. */
function hashOnce(password: string) {
	if (!hashes.has(password)) hashes.set(password, hashPassword(password));
	return hashes.get(password)!;
}

/** The default password for member added by tests. */
export const TEST_PASSWORD = 'correct horse 42';

/** Adds a member with a login and returns their ids. */
export async function addMember(input: {
	email: string;
	role: 'Owner' | 'Admin' | 'Member';
	name?: string;
	password?: string;
	active?: boolean;
	language?: Locale;
}) {
	const roleId =
		input.role === 'Owner' ? OWNER_ROLE_ID : (await repo.findRoleByName(db, input.role))?.id;
	if (!roleId) throw new Error(`Role ${input.role} is missing`);
	const userId = randomUUID();
	const memberId = randomUUID();
	await repo.insertCredentialUser(db, {
		userId,
		accountId: randomUUID(),
		name: input.name ?? `Test ${input.role}`,
		email: input.email,
		passwordHash: await hashOnce(input.password ?? TEST_PASSWORD)
	});
	await repo.insertMember(db, {
		id: memberId,
		userId,
		roleId,
		active: input.active,
		language: input.language
	});
	return { userId, memberId, email: input.email };
}
