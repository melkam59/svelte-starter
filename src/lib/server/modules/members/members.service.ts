import { createHash } from 'node:crypto';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { AppError, createLogger, pageOf } from '#lib/server/core/index.ts';
import { db } from '#lib/server/db/index.ts';
import { record, recordLater } from '#lib/server/modules/activity-log/index.ts';
import { procedure } from './members.procedure.ts';
import { allowAttempt } from '#lib/server/modules/rate-limits/index.ts';
import {
	OWNER_ROLE_ID,
	isPermissionCode,
	permissionCodes,
	type PermissionCode
} from '#lib/shared/permissions.ts';
import * as repo from './members.repository.ts';
import type { CurrentMember, SignInContext, SignedIn } from './members.types.ts';
import {
	languageInput,
	listRolesInput,
	setRolePermissionInput,
	type SignInInput
} from './members.schema.ts';

const log = createLogger('member');
const MINUTE = 60_000;
/** Wrong attempts allowed before the account locks. */
export const LOCK_AFTER = 5;
const MAX_LOCK = 30 * MINUTE;

/** Returns how long to lock an account after this many wrong attempts in a row, in milliseconds: nothing below 5, then 1 minute doubling each time, up to 30 minutes. */
export function lockFor(failures: number): number {
	if (failures < LOCK_AFTER) return 0;
	return Math.min(MINUTE * 2 ** (failures - LOCK_AFTER), MAX_LOCK);
}

/** Returns the signed-in member and their Permissions, or null if they have no member record or are switched off. Read fresh every time, so changes apply at once. */
export async function currentMember(userId: string): Promise<CurrentMember | null> {
	const row = await repo.findMemberByUserId(db, userId);
	if (!row || !row.active) return null;

	const isOwner = row.roleId === OWNER_ROLE_ID;
	const codes: PermissionCode[] = isOwner
		? permissionCodes
		: (await repo.listPermissionCodes(db, row.roleId)).filter(isPermissionCode);

	return {
		id: row.id,
		name: row.name,
		email: row.email,
		roleId: row.roleId,
		roleName: row.roleName,
		isOwner,
		permissions: new Set(codes)
	};
}

/** Checks whether a member holds a Permission. The Owner holds them all. */
export function can(me: CurrentMember, code: PermissionCode): boolean {
	return me.isOwner || me.permissions.has(code);
}

// Checked against when the email is unknown, so a refusal takes as long whether or not the email exists.
let dummyHash: Promise<string> | undefined;
const dummy = () => (dummyHash ??= hashPassword('not-a-real-password-0000'));

/** Counts this attempt against the IP and the email, and refuses it if either went over 10 in a minute. Emails are hashed so the table never holds them. */
async function checkRateLimits(email: string, context: SignInContext, now: Date) {
	const { ip } = context;
	const emailKey = createHash('sha256').update(email).digest('hex');
	const [byIp, byEmail] = await Promise.all([
		allowAttempt(`sign-in:ip:${ip}`, now),
		allowAttempt(`sign-in:email:${emailKey}`, now)
	]);
	if (byIp && byEmail) return;
	const by = byIp ? 'email' : 'ip';
	log.warn({ event: 'auth.rate_limited', ip, by }, 'sign-in rate limited');
	await recordLater({
		type: 'auth.rate_limited',
		ip,
		after: { by }
	});
	throw new AppError('RATE_LIMITED', 'common_error_rate_limited');
}

/** Error for an account that is locked, saying roughly how many minutes are left. */
function lockedError(until: Date, now: Date) {
	const minutes = Math.max(1, Math.ceil((until.getTime() - now.getTime()) / MINUTE));
	return new AppError('RULE', 'auth_error_account_locked', { params: { minutes } });
}

/** Checks an email and password. Returns who signed in and their language, or throws the reason they can't. Five wrong passwords in a row lock the account for a while, and more than 10 attempts a minute from one IP or on one email are refused. */
export async function signIn(input: SignInInput, context: SignInContext): Promise<SignedIn> {
	const now = context.now ?? new Date();
	// Callers may pass unchecked input, so the email is normalised here too.
	const email = input.email.trim().toLowerCase();
	const wrong = () => new AppError('UNAUTHORIZED', 'auth_error_wrong_credentials');
	await checkRateLimits(email, context, now);

	const found = await repo.findSignInByEmail(db, email);
	if (!found?.passwordHash || !found.active) {
		await verifyPassword({ hash: await dummy(), password: input.password });
		await recordLater({
			type: 'auth.sign_in_failed',
			ip: context.ip,
			entity: found ? { type: 'member', id: found.memberId } : undefined
		});
		throw wrong();
	}

	const { memberId } = found;
	if (found.lockedUntil && found.lockedUntil > now) throw lockedError(found.lockedUntil, now);

	const ok = await verifyPassword({ hash: found.passwordHash, password: input.password });
	if (!ok) {
		const entity = { type: 'member', id: memberId };
		const lockedUntil = await db.transaction(async (tx) => {
			const failedAttempts = await repo.addFailedAttempt(tx, memberId);
			const lock = lockFor(failedAttempts);
			if (lock === 0) {
				await record(tx, {
					type: 'auth.sign_in_failed',
					ip: context.ip,
					entity
				});
				return null;
			}
			const until = new Date(now.getTime() + lock);
			await repo.lockUntil(tx, memberId, until);
			await record(tx, {
				type: 'auth.locked',
				ip: context.ip,
				entity,
				after: { failedAttempts, lockedUntil: until.toISOString() }
			});
			return until;
		});
		if (lockedUntil) {
			log.warn({ event: 'auth.locked', memberId, ip: context.ip, lockedUntil }, 'account locked');
			throw lockedError(lockedUntil, now);
		}
		throw wrong();
	}

	await db.transaction(async (tx) => {
		await repo.touchLastSignIn(tx, memberId, now);
		await record(tx, {
			type: 'auth.signed_in',
			actorMemberId: memberId,
			ip: context.ip,
			entity: { type: 'member', id: memberId }
		});
	});
	return {
		memberId,
		userId: found.userId,
		language: found.language === 'am' ? 'am' : 'en'
	};
}

/** Lists every Role and the Permissions it holds. The Owner Role holds them all and can't be edited. */
export const listRoles = procedure('members.listRoles', {
	access: 'owner',
	input: listRolesInput,
	async run(input) {
		const rows = await repo.listRolesWithPermissions(db, input);
		const roles = rows.map((r) => {
			const isOwner = r.id === OWNER_ROLE_ID;
			return {
				id: r.id,
				name: r.name,
				isEditable: !isOwner,
				permissions: isOwner ? permissionCodes : r.codes.filter(isPermissionCode)
			};
		});
		return pageOf(roles, input.limit, (r) => r.name);
	}
});

/** Gives a Role a Permission or takes it away. Owner only; member holding the Role get the change on their next request. */
export const setRolePermission = procedure('members.setRolePermission', {
	access: 'owner',
	input: setRolePermissionInput,
	async run({ roleId, code, granted }, { me, ip }) {
		if (roleId === OWNER_ROLE_ID) throw new AppError('RULE', 'members_error_owner_role_fixed');
		await db.transaction(async (tx) => {
			if (!(await repo.findRoleById(tx, roleId))) throw new AppError('NOT_FOUND');
			const had = await repo.roleHasPermission(tx, roleId, code);
			if (had === granted) return;
			if (granted) await repo.insertRolePermissions(tx, roleId, [code]);
			else await repo.deleteRolePermission(tx, roleId, code);
			await record(tx, {
				type: 'role.permission_changed',
				actorMemberId: me.id,
				ip,
				entity: { type: 'role', id: roleId },
				before: { granted: had },
				after: { granted },
				reason: code
			});
		});
		return { roleId, code, granted };
	}
});

/** Saves the signed-in member's own language, so their next sign-in on any device uses it. */
export const saveMyLanguage = procedure('members.saveMyLanguage', {
	access: 'signed-in',
	input: languageInput,
	async run(language, { me }) {
		await repo.updateLanguage(db, me.id, language);
	}
});
