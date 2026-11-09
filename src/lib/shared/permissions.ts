// The list of Permissions a Role can hold. The database copies it on every deploy and never
// deletes from it; rename or remove a code with a migration. Safe to use in the browser.
// Add your app's Permissions here as you build modules, then grant them in `startingRoles`.

/** The sections Permissions are grouped under on screen. */
export const permissionGroups = ['content', 'admin'] as const;
export type PermissionGroup = (typeof permissionGroups)[number];

/** Every Permission the app checks, with the section it appears under on screen. */
export const permissions = {
	'note:read': 'content',
	'note:write': 'content',
	'audit:read': 'admin',
	'user:manage': 'admin',
	'settings:manage': 'admin'
} as const satisfies Record<string, PermissionGroup>;

export type PermissionCode = keyof typeof permissions;

/** Every Permission code, in display order. */
export const permissionCodes = Object.keys(permissions) as PermissionCode[];

/** Checks whether a string is a known Permission code. */
export function isPermissionCode(value: string): value is PermissionCode {
	return Object.hasOwn(permissions, value);
}

/** The id of the Owner Role, which holds every Permission. */
export const OWNER_ROLE_ID = 'owner';

const member: PermissionCode[] = ['note:read', 'note:write'];

/** The Roles every new install starts with. The Owner can change them afterwards. */
export const startingRoles: { name: string; permissions: PermissionCode[] }[] = [
	{ name: 'Member', permissions: member },
	{ name: 'Admin', permissions: [...member, 'audit:read', 'user:manage'] }
];
