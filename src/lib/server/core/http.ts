import { json } from '@sveltejs/kit';
import type { z } from 'zod';
import { appError, validationError } from './errors.ts';

/** Returns JSON data with status 200. Failures are thrown as AppError instead. */
export function ok<T>(data: T, init?: ResponseInit): Response {
	return json(data, init);
}

/** Returns JSON data with status 201 Created. */
export function created<T>(data: T): Response {
	return json(data, { status: 201 });
}

/** Returns an empty 204 response. */
export function noContent(): Response {
	return new Response(null, { status: 204 });
}

/** Reads and checks a JSON request body against a schema. */
export async function parseJson<S extends z.ZodType>(
	request: Request,
	schema: S
): Promise<z.output<S>> {
	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		throw appError('VALIDATION', 'common_error_invalid_json', { message: 'Body must be JSON' });
	}
	const result = schema.safeParse(raw);
	if (!result.success) throw validationError(result.error.issues);
	return result.data;
}

/** Reads and checks URL query values against a schema. */
export function parseQuery<S extends z.ZodType>(url: URL, schema: S): z.output<S> {
	const result = schema.safeParse(Object.fromEntries(url.searchParams));
	if (!result.success) throw validationError(result.error.issues);
	return result.data;
}
