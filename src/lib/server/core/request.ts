import { randomUUID } from 'node:crypto';
import type { Handle } from '@sveltejs/kit/hooks';
import { createLogger } from './logger.ts';
import { observeRequest } from './metrics.ts';

const httpLog = createLogger('http');
const safeRequestId = /^[A-Za-z0-9._-]{8,128}$/;

/** Returns the request id from the proxy if it looks valid, otherwise a new one. */
export function requestIdFrom(headers: Headers): string {
	const incoming = headers.get('x-request-id');
	return incoming && safeRequestId.test(incoming) ? incoming : randomUUID();
}

const securityHeaders: Record<string, string> = {
	'x-content-type-options': 'nosniff',
	'referrer-policy': 'strict-origin-when-cross-origin',
	'x-frame-options': 'DENY',
	'permissions-policy': 'camera=(self), microphone=(self), geolocation=()'
};

function setHeaders(response: Response, headers: Record<string, string>): void {
	try {
		for (const [name, value] of Object.entries(headers)) {
			if (!response.headers.has(name)) response.headers.set(name, value);
		}
	} catch {
		// Some responses (e.g. proxied fetches) have immutable headers.
	}
}

/** Runs first on every request: gives it an id and a logger, logs it, times it and adds security headers. */
export const handleRequest: Handle = async ({ event, resolve }) => {
	const requestId = requestIdFrom(event.request.headers);
	event.locals.requestId = requestId;
	event.locals.log = httpLog.child({
		requestId,
		method: event.request.method,
		path: event.url.pathname
	});

	const startedAt = performance.now();
	const response = await resolve(event);
	const seconds = (performance.now() - startedAt) / 1000;
	const route = event.route.id ?? 'unmatched';

	observeRequest(event.request.method, route, response.status, seconds);
	event.locals.log[response.status >= 500 ? 'error' : 'info'](
		{ status: response.status, route, durationMs: Math.round(seconds * 1000) },
		'request completed'
	);

	setHeaders(response, { 'x-request-id': requestId, ...securityHeaders });
	return response;
};
