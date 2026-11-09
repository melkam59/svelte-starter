import { redirect } from '@sveltejs/kit';
import { auth } from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

/** Sends a plain visit to /sign-out back to the app. Signing out needs a form post, so a link or a preloaded page can't sign anyone out. */
export const load: PageServerLoad = () => redirect(303, '/app');

/** Signs the current person out and opens the sign-in page. */
export const actions: Actions = {
	default: async ({ request }) => {
		await auth.api.signOut({ headers: request.headers });
		redirect(303, '/sign-in');
	}
};
