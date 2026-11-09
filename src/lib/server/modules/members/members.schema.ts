import { z } from 'zod';
import { listInput } from '#lib/server/core/index.ts';
import { locales } from '#lib/paraglide/runtime.js';
import { permissionCodes, type PermissionCode } from '#lib/shared/permissions.ts';

/** Checks the sign-in form: a valid email and a non-empty password. Error messages are translation keys, which the screens translate. */
export const signInInput = z.object({
	email: z
		.string()
		.trim()
		.toLowerCase()
		.pipe(z.email({ error: 'auth_field_email_invalid' })),
	password: z.string().min(1, { error: 'auth_field_password_required' })
});
export type SignInInput = z.infer<typeof signInInput>;

/** Gives a Role a Permission or takes it away. Only codes from the Permission list are accepted. */
export const setRolePermissionInput = z.object({
	roleId: z.string().min(1).max(36),
	code: z.enum(permissionCodes as [PermissionCode, ...PermissionCode[]], {
		error: 'members_error_unknown_permission'
	}),
	granted: z.boolean()
});
export type SetRolePermissionInput = z.infer<typeof setRolePermissionInput>;

/** One page of Roles, by name. */
export const listRolesInput = listInput;

/** A language the screens can use. */
export const languageInput = z.enum(locales, { error: 'common_error_invalid_choice' });
