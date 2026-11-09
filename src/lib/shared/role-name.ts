import { m } from '#lib/paraglide/messages.js';

const builtIn: Record<string, () => string> = {
	Owner: m.members_role_owner,
	Admin: m.members_role_admin,
	Member: m.members_role_member
};

/** Shows a Role's name in the current language. Built-in Roles are translated; Roles the Owner made keep their name. */
export function roleLabel(name: string): string {
	return builtIn[name]?.() ?? name;
}
