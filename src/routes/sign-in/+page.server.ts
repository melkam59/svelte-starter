import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';
import { AppError, isAppError, validationError } from '#lib/server/core/index.ts';
import { cookieName } from '#lib/paraglide/runtime.js';
import { currentMember, signIn, signInInput } from '#lib/server/modules/members/index.ts';
import type { Actions, PageServerLoad } from './$types';

/** Returns the page to open after sign-in. Only pages inside the app are allowed, so a link can't send someone to another site. */
function safeRedirect(target: string | null): string {
	return target && /^\/app(\/|$|\?)/.test(target) && !target.startsWith('//') ? target : '/app';
}

/** Skips the sign-in page for someone who is already signed in. */
export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user && (await currentMember(locals.user.id))) {
		redirect(303, safeRedirect(url.searchParams.get('redirectTo')));
	}
	return {};
};

/** Checks the email and password, signs the member in and opens the app in their language. */
export const actions: Actions = {
	default: async ({ request, url, locals, cookies, getClientAddress }) => {
		const form = Object.fromEntries(await request.formData());
		const email = typeof form.email === 'string' ? form.email : '';
		const refuse = (error: AppError) =>
			fail(error.status, { email, error: error.toBody(locals.requestId) });

		const parsed = signInInput.safeParse(form);
		if (!parsed.success) return refuse(validationError(parsed.error.issues));

		let signedIn;
		try {
			signedIn = await signIn(parsed.data, {
				ip: getClientAddress(),
				deviceId: request.headers.get('x-device-id')
			});
		} catch (error) {
			if (isAppError(error)) return refuse(error);
			throw error;
		}

		// The password is already checked; this asks the auth library for the session cookie.
		try {
			await auth.api.signInEmail({
				body: parsed.data,
				headers: request.headers
			});
		} catch (error) {
			if (error instanceof APIError)
				return refuse(new AppError('UNAUTHORIZED', 'auth_error_wrong_credentials'));
			throw error;
		}

		cookies.set(cookieName, signedIn.language, {
			path: '/',
			httpOnly: false,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 400
		});
		redirect(303, safeRedirect(url.searchParams.get('redirectTo')));
	}
};
