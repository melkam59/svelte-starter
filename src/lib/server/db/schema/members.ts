// Tables for members (people who can sign in to the app), Roles and Permissions.
import { sql } from 'drizzle-orm';
import {
	boolean,
	check,
	index,
	pgTable,
	primaryKey,
	smallint,
	text,
	uniqueIndex,
	uuid,
	varchar
} from 'drizzle-orm/pg-core';
import { OWNER_ROLE_ID } from '../../../shared/permissions.ts';
import { at, createdAtColumn, updatedAtColumn } from '../columns.ts';
import { user } from './auth.ts';

/** Every Permission, copied from the list in code so Roles can reference them. */
export const permission = pgTable('permission', {
	code: varchar('code', { length: 64 }).primaryKey(),
	groupKey: varchar('group_key', { length: 32 }).notNull(),
	sort: smallint('sort').notNull()
});

/** Roles such as Admin or Member. The Owner Role has the id `owner` and holds every Permission without rows. */
export const role = pgTable('role', {
	id: varchar('id', { length: 36 }).primaryKey(),
	name: varchar('name', { length: 64 }).notNull().unique(),
	description: varchar('description', { length: 255 }),
	createdAt: createdAtColumn(),
	updatedAt: updatedAtColumn()
});

/** Which Permissions each Role holds. */
export const rolePermission = pgTable(
	'role_permission',
	{
		roleId: varchar('role_id', { length: 36 })
			.notNull()
			.references(() => role.id, { onDelete: 'cascade' }),
		permissionCode: varchar('permission_code', { length: 64 })
			.notNull()
			.references(() => permission.code, { onDelete: 'cascade', onUpdate: 'cascade' }),
		createdAt: createdAtColumn()
	},
	(t) => [
		primaryKey({ columns: [t.roleId, t.permissionCode] }),
		index('role_permission_permission_idx').on(t.permissionCode)
	]
);

/** People who use the app. Each has one login and one Role. */
export const member = pgTable(
	'member',
	{
		id: uuid('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.unique()
			.references(() => user.id, { onDelete: 'restrict' }),
		// A Role can't be deleted while someone holds it.
		roleId: varchar('role_id', { length: 36 })
			.notNull()
			.references(() => role.id, { onDelete: 'restrict' }),
		active: boolean('active').notNull().default(true),
		language: varchar('language', { length: 8 }).notNull().default('en'),
		/** Wrong passwords since the last success, used for the lockout. */
		failedAttempts: smallint('failed_attempts').notNull().default(0),
		lockedUntil: at('locked_until'),
		lastSignInAt: at('last_sign_in_at'),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn()
	},
	(t) => [
		index('member_role_idx').on(t.roleId),
		// Only one member can hold the Owner Role.
		uniqueIndex('member_one_owner_uq')
			.on(t.roleId)
			.where(sql`${t.roleId} = '${sql.raw(OWNER_ROLE_ID)}'`),
		check('member_language_ck', sql`${t.language} in ('en', 'am')`)
	]
);
