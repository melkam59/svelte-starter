import { building } from '$app/env';
import { auth } from '#lib/server/auth.ts';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import {
	type Handle,
	type HandleServerError,
	sequence
} from '@sveltejs/kit/hooks';
import { getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
import {
	handleRequest,
	logger,
	reportError,
	shapeError,
	type Caught
} from '#lib/server/core/index.ts';

// Picks the language from the `language` cookie, or the base language when there is none.
const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
			return resolve(
				{ ...event, request },
				{
					transformPageChunk: ({ html }) =>
						html
							.replace('%paraglide.lang%', locale)
							.replace('%paraglide.dir%', getTextDirection(locale))
				}
			);
	});

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

/** Runs on every request: request id and logging, language, then the signed-in session. */
export const handle: Handle = sequence(handleRequest, handleParaglide, handleBetterAuth);

/** Turns any server error into the error body the screens expect, and logs it. */
export const handleError: HandleServerError = (input) => {
	const caught = input as Caught;
	const { event } = input;
	try {
		const shaped = shapeError(caught, event.locals.requestId);
		reportError(caught, shaped, event.locals.log ?? logger);
		return { ...shaped.body, ...(shaped.status && { status: shaped.status }) };
	} catch (err) {
		logger.fatal({ err }, 'handleError failed');
		return {
			message: 'Something went wrong',
			code: 'INTERNAL',
			messageKey: 'common_error_internal',
			status: 500
		};
	}
};
