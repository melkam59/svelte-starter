import { notFound } from '#lib/server/core/index.ts';
import type { RequestHandler } from './$types';

/** Answers any unknown API address with a JSON "not found" error. */
export const fallback: RequestHandler = () => {
	throw notFound('common_error_not_found');
};
