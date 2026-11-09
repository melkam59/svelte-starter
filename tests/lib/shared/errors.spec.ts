import { describe, expect, it } from 'vitest';
import {
	codeForStatus,
	errorOf,
	fallbackError,
	fieldErrorsFor,
	isErrorBody
} from '#lib/shared/errors.ts';

const body = { message: 'x', code: 'CONFLICT', messageKey: 'common_error_conflict' } as const;

describe('error contract', () => {
	it('recognises an ErrorBody and rejects lookalikes', () => {
		expect(isErrorBody(body)).toBe(true);
		expect(isErrorBody({ ...body, code: 'TEAPOT' })).toBe(false);
		expect(isErrorBody({ message: 'x' })).toBe(false);
		expect(isErrorBody(null)).toBe(false);
	});

	it('reads the body of an HttpError thrown by a remote function', () => {
		expect(errorOf({ status: 409, body })).toEqual(body);
	});

	it('falls back to the status code when the body is not ours', () => {
		expect(errorOf({ status: 404, body: { message: 'Not Found' } })).toMatchObject({
			code: 'NOT_FOUND',
			messageKey: 'common_error_not_found'
		});
	});

	it('turns anything else into the generic INTERNAL error', () => {
		expect(errorOf(new Error('boom'))).toEqual(fallbackError);
		expect(errorOf('boom')).toEqual(fallbackError);
	});

	it('maps statuses to codes', () => {
		expect(codeForStatus(422)).toBe('RULE');
		expect(codeForStatus(502)).toBe('INTERNAL');
		expect(codeForStatus(418)).toBe('VALIDATION');
	});

	it('returns field errors for one field', () => {
		const withFields = { ...body, fieldErrors: { name: ['required'] } };
		expect(fieldErrorsFor(withFields, 'name')).toEqual(['required']);
		expect(fieldErrorsFor(withFields, 'phone')).toEqual([]);
	});
});
