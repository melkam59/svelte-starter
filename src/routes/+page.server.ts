import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Sends visitors from the home page to sign in. Signed-in member go on from there to the app. */
export const load: PageServerLoad = () => redirect(307, '/sign-in');
