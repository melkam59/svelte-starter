import type { HandleClientError } from '@sveltejs/kit/hooks';
import { fallbackError, isErrorBody } from '#lib/shared/errors.ts';

/** Turns any browser error into the error body the screens expect. */
export const handleError: HandleClientError = ({ error, kind }) => {
	if (kind === 'app' && isErrorBody(error)) return error;
	if (kind === 'unknown') console.error(error);
	return fallbackError;
};
