// Database queries for members, Roles and Permissions. Each takes the database client, so the same query works inside a transaction or a script.
import { and, asc, eq, gt, inArray, sql } from 'drizzle-orm';
import { upsert } from '#lib/server/db/dialect.ts';
import type { Executor } from '#lib/server/db/index.ts';
import type { Locale } from '#lib/paraglide/runtime.js';
import {
	account,
	permission,
	role,
	rolePermission,
	member,
	user
} from '#lib/server/db/schema/index.ts';

/** Finds a member, with their Role name, by their login id. */
export async function findMemberByUserId(db: Executor, userId: string) {
	const [row] = await db
		.select({
			id: member.id,
			active: member.active,
			roleId: member.roleId,
			roleName: role.name,
			name: user.name,
			email: user.email
		})
		.from(member)
		.innerJoin(role, eq(role.id, member.roleId))
		.innerJoin(user, eq(user.id, member.userId))
		.where(eq(member.userId, userId))
		.limit(1);
	return row;
}

/** Finds what sign-in needs to know about the member with this email: their password hash, language and lockout state. */
export async function findSignInByEmail(db: Executor, email: string) {
	const [row] = await db
		.select({
			memberId: member.id,
			userId: member.userId,
			active: member.active,
			language: member.language,
			failedAttempts: member.failedAttempts,
			lockedUntil: member.lockedUntil,
			passwordHash: account.password
		})
		.from(member)
		.innerJoin(user, eq(user.id, member.userId))
		.leftJoin(account, and(eq(account.userId, user.id), eq(account.providerId, 'credential')))
		.where(eq(user.email, email))
		.limit(1);
	return row;
}

/** Returns the Permission codes a Role holds. */
export async function listPermissionCodes(db: Executor, roleId: string): Promise<string[]> {
	const rows = await db
		.select({ code: rolePermission.permissionCode })
		.from(rolePermission)
		.where(eq(rolePermission.roleId, roleId));
	return rows.map((r) => r.code);
}

/** Adds a Permission, or updates its group and order if it exists. */
export async function upsertPermission(
	db: Executor,
	row: { code: string; groupKey: string; sort: number }
) {
	await upsert(db, permission, permission.code, row, { groupKey: row.groupKey, sort: row.sort });
}

/** Finds a Role by its name. */
export async function findRoleByName(db: Executor, name: string) {
	const [row] = await db.select({ id: role.id }).from(role).where(eq(role.name, name)).limit(1);
	return row;
}

/** Finds a Role by its id. */
export async function findRoleById(db: Executor, id: string) {
	const [row] = await db.select({ id: role.id }).from(role).where(eq(role.id, id)).limit(1);
	return row;
}

/** Creates a Role. */
export async function insertRole(db: Executor, row: { id: string; name: string }) {
	await db.insert(role).values(row);
}

/** Gives a Role a list of Permissions. */
export async function insertRolePermissions(db: Executor, roleId: string, codes: string[]) {
	if (codes.length === 0) return;
	await db
		.insert(rolePermission)
		.values(codes.map((permissionCode) => ({ roleId, permissionCode })));
}

/** Returns the login id for an email, if there is one. */
export async function findUserIdByEmail(db: Executor, email: string) {
	const [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
	return row?.id;
}

/** Creates a login with an email and password, stored the way Better Auth expects. */
export async function insertCredentialUser(
	db: Executor,
	row: { userId: string; accountId: string; name: string; email: string; passwordHash: string }
) {
	const now = new Date();
	await db.insert(user).values({
		id: row.userId,
		name: row.name,
		email: row.email,
		emailVerified: true,
		updatedAt: now
	});
	await db.insert(account).values({
		id: row.accountId,
		accountId: row.userId,
		providerId: 'credential',
		userId: row.userId,
		password: row.passwordHash,
		updatedAt: now
	});
}

/** Creates a member for an existing login. */
export async function insertMember(
	db: Executor,
	row: { id: string; userId: string; roleId: string; active?: boolean; language?: Locale }
) {
	await db.insert(member).values(row);
}

/** Saves the sign-in time and clears the lockout counter. */
export async function touchLastSignIn(db: Executor, memberId: string, at = new Date()) {
	await db
		.update(member)
		.set({ lastSignInAt: at, failedAttempts: 0, lockedUntil: null })
		.where(eq(member.id, memberId));
}

/** Adds one to a member's wrong attempts and returns the new count. Run it in a transaction so two attempts can't read the same count. */
export async function addFailedAttempt(db: Executor, memberId: string): Promise<number> {
	const [row] = await db
		.update(member)
		.set({ failedAttempts: sql`${member.failedAttempts} + 1` })
		.where(eq(member.id, memberId))
		.returning({ failedAttempts: member.failedAttempts });
	return row?.failedAttempts ?? 0;
}

/** Locks a member out until the given time. */
export async function lockUntil(db: Executor, memberId: string, until: Date) {
	await db.update(member).set({ lockedUntil: until }).where(eq(member.id, memberId));
}

/** Saves the language a member's screens use. */
export async function updateLanguage(db: Executor, memberId: string, language: Locale) {
	await db.update(member).set({ language }).where(eq(member.id, memberId));
}

/** Lists one page of Roles by name, after the cursor name, with the Permission codes each holds. */
export async function listRolesWithPermissions(
	db: Executor,
	page: { limit: number; cursor?: string }
) {
	const roles = await db
		.select({ id: role.id, name: role.name })
		.from(role)
		.where(page.cursor ? gt(role.name, page.cursor) : undefined)
		.orderBy(asc(role.name))
		.limit(page.limit + 1);
	if (roles.length === 0) return [];
	const grants = await db
		.select({ roleId: rolePermission.roleId, code: rolePermission.permissionCode })
		.from(rolePermission)
		.where(
			inArray(
				rolePermission.roleId,
				roles.map((r) => r.id)
			)
		);
	return roles.map((r) => ({
		...r,
		codes: grants.filter((g) => g.roleId === r.id).map((g) => g.code)
	}));
}

/** Whether a Role holds a Permission. */
export async function roleHasPermission(db: Executor, roleId: string, code: string) {
	const [row] = await db
		.select({ code: rolePermission.permissionCode })
		.from(rolePermission)
		.where(and(eq(rolePermission.roleId, roleId), eq(rolePermission.permissionCode, code)))
		.limit(1);
	return Boolean(row);
}

/** Takes a Permission away from a Role. */
export async function deleteRolePermission(db: Executor, roleId: string, code: string) {
	await db
		.delete(rolePermission)
		.where(and(eq(rolePermission.roleId, roleId), eq(rolePermission.permissionCode, code)));
}
