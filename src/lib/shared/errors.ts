// The error shape shared by the server and the screens. Safe to use in the browser.

/** The HTTP status for each error code. */
export const errorStatus = {
	VALIDATION: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	RULE: 422,
	RATE_LIMITED: 429,
	INTERNAL: 500,
	UNAVAILABLE: 503
} as const;

export type ErrorCode = keyof typeof errorStatus;

export type ErrorParams = Record<string, string | number>;

/** Message keys for each form field, by field name such as `lines.0.quantity`. */
export type FieldErrors = Record<string, string[]>;

/** The body of every error the screens receive. */
export interface ErrorBody {
	message: string;
	code: ErrorCode;
	messageKey: string;
	params?: ErrorParams;
	fieldErrors?: FieldErrors;
	requestId?: string;
}

const codes = new Set(Object.keys(errorStatus));

/** Checks whether a value has the shape of an error body. */
export function isErrorBody(value: unknown): value is ErrorBody {
	if (typeof value !== 'object' || value === null) return false;
	const body = value as Partial<ErrorBody>;
	return (
		typeof body.code === 'string' && codes.has(body.code) && typeof body.messageKey === 'string'
	);
}

/** Returns the error code that matches an HTTP status. */
export function codeForStatus(status: number): ErrorCode {
	const match = (Object.entries(errorStatus) as [ErrorCode, number][]).find(
		([, value]) => value === status
	);
	if (match) return match[0];
	return status >= 500 ? 'INTERNAL' : 'VALIDATION';
}

/** The generic error shown when nothing more specific is known. */
export const fallbackError: ErrorBody = {
	message: 'Something went wrong',
	code: 'INTERNAL',
	messageKey: 'common_error_internal'
};

/** Turns anything that was thrown into an error body the screens can show. */
export function errorOf(thrown: unknown): ErrorBody {
	if (isErrorBody(thrown)) return thrown;
	if (typeof thrown === 'object' && thrown !== null) {
		const { body, status } = thrown as { body?: unknown; status?: number };
		if (isErrorBody(body)) return body;
		if (typeof status === 'number') {
			const code = codeForStatus(status);
			return { ...fallbackError, code, messageKey: messageKeyFor(code) };
		}
	}
	return fallbackError;
}

/** Returns the translation key for an error code's generic message. */
export function messageKeyFor(code: ErrorCode): string {
	return `common_error_${code.toLowerCase()}`;
}

/** Returns the message keys for one form field. */
export function fieldErrorsFor(error: ErrorBody, field: string): string[] {
	return error.fieldErrors?.[field] ?? [];
}
