import { ORIGIN, BETTER_AUTH_SECRET } from '$app/env/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '#lib/server/db/index.ts';

/** Sign-in with email and password, sessions and cookies. */
export const auth = betterAuth({
	baseURL: ORIGIN,
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	// Nobody signs themselves up by default; the Owner adds members. Flip this for a public app.
	emailAndPassword: { enabled: true, disableSignUp: true },
	// Sign-in goes through the sign-in page, which applies the lockout and rate limits. The page calls this
	// endpoint from the server, so only outside requests to it are closed.
	disabledPaths: ['/sign-in/email'],
	// Limits requests to the endpoints still open, counted in the database so it holds across processes.
	rateLimit: { enabled: true, storage: 'database', modelName: 'authRateLimit' },
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
