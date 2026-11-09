import type { PermissionCode } from '#lib/shared/permissions.ts';
import type { Locale } from '#lib/paraglide/runtime.js';

/** The signed-in member, with the Permissions their Role holds. */
export interface CurrentMember {
	id: string;
	name: string;
	email: string;
	roleId: string;
	roleName: string;
	isOwner: boolean;
	permissions: ReadonlySet<PermissionCode>;
}

/** Where and when a sign-in attempt happens. */
export interface SignInContext {
	/** The address the attempt came from, used for rate limits. */
	ip: string;
	/** The current time. Tests pass a fixed time. */
	now?: Date;
}

/** A successful sign-in: who it was and the language their screens use. */
export interface SignedIn {
	memberId: string;
	userId: string;
	language: Locale;
}
