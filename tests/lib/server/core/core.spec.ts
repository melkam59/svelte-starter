import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { appError, fieldErrorsFromIssues, rule, toAppError } from '#lib/server/core/errors.ts';
import { shapeError } from '#lib/server/core/handle-error.ts';
import { healthReport } from '#lib/server/core/health.ts';
import { requestIdFrom } from '#lib/server/core/request.ts';

describe('AppError', () => {
	it('carries status, code, key, params and field errors into its body', () => {
		const error = appError('VALIDATION', 'products_error_barcode_taken', {
			params: { barcode: '6291041500213' },
			fieldErrors: { barcode: ['products_error_barcode_taken'] }
		});
		expect(error.status).toBe(400);
		expect(error.toBody('req-1')).toEqual({
			message: 'Check the highlighted fields',
			code: 'VALIDATION',
			messageKey: 'products_error_barcode_taken',
			params: { barcode: '6291041500213' },
			fieldErrors: { barcode: ['products_error_barcode_taken'] },
			requestId: 'req-1'
		});
	});

	it('defaults the message key from the code', () => {
		expect(appError('FORBIDDEN').messageKey).toBe('common_error_forbidden');
		expect(rule('stock_error_expired', { batch: 'L1' }).status).toBe(422);
	});

	it('groups schema issues by dotted path', () => {
		expect(
			fieldErrorsFromIssues([
				{ message: 'required', path: ['lines', 0, 'quantity'] },
				{ message: 'too short', path: [{ key: 'name' }] },
				{ message: 'too long', path: ['name'] },
				{ message: 'bad shape' }
			])
		).toEqual({
			'lines.0.quantity': ['required'],
			name: ['too short', 'too long'],
			_: ['bad shape']
		});
	});

	it('treats a ZodError as VALIDATION and anything else as a bug', () => {
		const parsed = z.object({ name: z.string() }).safeParse({});
		expect(toAppError(parsed.error)?.code).toBe('VALIDATION');
		expect(toAppError(new Error('boom'))).toBeNull();
	});
});

describe('shapeError', () => {
	it('keeps an app error body and adds the request id', () => {
		const shaped = shapeError(
			{ kind: 'app', error: { status: 409, message: 'm', code: 'CONFLICT', messageKey: 'k' } },
			'req-1'
		);
		expect(shaped).toEqual({
			body: { status: 409, message: 'm', code: 'CONFLICT', messageKey: 'k', requestId: 'req-1' }
		});
	});

	it('maps remote-function validation issues to field errors with status 400', () => {
		const shaped = shapeError({
			kind: 'validation',
			error: { status: 400, message: 'Bad Request' },
			issues: [{ message: 'required', path: ['name'] }]
		});
		expect(shaped.status).toBe(400);
		expect(shaped.body).toMatchObject({ code: 'VALIDATION', fieldErrors: { name: ['required'] } });
	});

	it('maps framework errors by status', () => {
		const shaped = shapeError({ kind: 'framework', error: { status: 404, message: 'Not Found' } });
		expect(shaped.body).toMatchObject({ code: 'NOT_FOUND', messageKey: 'common_error_not_found' });
	});

	it('gives a thrown AppError its own status', () => {
		const shaped = shapeError({ kind: 'unknown', error: appError('RULE', 'sales_error_closed') });
		expect(shaped.status).toBe(422);
		expect(shaped.body.messageKey).toBe('sales_error_closed');
	});

	it('hides a real bug behind INTERNAL 500 with no stack', () => {
		const shaped = shapeError({ kind: 'unknown', error: new Error('ER_NO_SUCH_TABLE') });
		expect(shaped.status).toBe(500);
		expect(shaped.body.code).toBe('INTERNAL');
		expect(JSON.stringify(shaped.body)).not.toContain('stack');
	});
});

describe('request id', () => {
	it('reuses a well-formed incoming id and replaces anything else', () => {
		expect(requestIdFrom(new Headers({ 'x-request-id': 'abc12345-proxy' }))).toBe('abc12345-proxy');
		expect(requestIdFrom(new Headers({ 'x-request-id': '<script>' }))).not.toBe('<script>');
		expect(requestIdFrom(new Headers())).toMatch(/^[0-9a-f-]{36}$/);
	});
});

describe('healthReport', () => {
	it('is ok when every check passes and degraded when one fails', async () => {
		const passing = await healthReport({ database: async () => 1 });
		expect(passing.status).toBe('ok');
		expect(passing.checks.database.ok).toBe(true);

		const failing = await healthReport({
			database: async () => {
				throw new Error('ECONNREFUSED');
			}
		});
		expect(failing.status).toBe('degraded');
		expect(failing.checks.database).toMatchObject({ ok: false, error: 'ECONNREFUSED' });
	});
});
