import { redirect } from '@sveltejs/kit';
import { currentMember } from '#lib/server/modules/members/index.ts';
import type { LayoutServerLoad } from './$types';

/** Lets only active members into the app and passes their name and Role to the screens. */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	const me = locals.user ? await currentMember(locals.user.id) : null;
	if (!me) {
		redirect(303, `/sign-in?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
	}
	return {
		me: { name: me.name, email: me.email, roleName: me.roleName, isOwner: me.isOwner }
	};
};
