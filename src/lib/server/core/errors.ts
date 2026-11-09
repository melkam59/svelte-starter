import { ZodError } from 'zod';
import {
	errorStatus,
	messageKeyFor,
	type ErrorBody,
	type ErrorCode,
	type ErrorParams,
	type FieldErrors
} from '#lib/shared/errors.ts';
import type { UpdateResult } from '#lib/server/db/writes.ts';

export type { ErrorBody, ErrorCode, FieldErrors } from '#lib/shared/errors.ts';

const defaultMessages: Record<ErrorCode, string> = {
	VALIDATION: 'Check the highlighted fields',
	UNAUTHORIZED: 'Sign in first',
	FORBIDDEN: "You don't have permission to do this",
	NOT_FOUND: 'Not found',
	CONFLICT: 'Someone else changed this. Reload and try again',
	RULE: 'This action is not allowed',
	RATE_LIMITED: 'Too many attempts. Wait a moment and try again',
	INTERNAL: 'Something went wrong',
	UNAVAILABLE: 'The service is temporarily unavailable'
};

interface AppErrorOptions {
	params?: ErrorParams;
	fieldErrors?: FieldErrors;
	/** English text for logs; screens show the translated message instead. */
	message?: string;
	cause?: unknown;
}

/** An expected failure, such as a missing Permission. The server turns it into an error body and status. */
export class AppError extends Error {
	readonly code: ErrorCode;
	readonly messageKey: string;
	readonly params?: ErrorParams;
	readonly fieldErrors?: FieldErrors;

	constructor(code: ErrorCode, messageKey = messageKeyFor(code), options: AppErrorOptions = {}) {
		super(options.message ?? defaultMessages[code], { cause: options.cause });
		this.name = 'AppError';
		this.code = code;
		this.messageKey = messageKey;
		this.params = options.params;
		this.fieldErrors = options.fieldErrors;
	}

	get status(): number {
		return errorStatus[this.code];
	}

	toBody(requestId?: string): ErrorBody {
		return {
			message: this.message,
			code: this.code,
			messageKey: this.messageKey,
			...(this.params && { params: this.params }),
			...(this.fieldErrors && { fieldErrors: this.fieldErrors }),
			...(requestId && { requestId })
		};
	}
}

/** Checks whether a value is an AppError. */
export function isAppError(value: unknown): value is AppError {
	return value instanceof AppError;
}

/** Creates an AppError for a code, with an optional message key. */
export function appError(
	code: ErrorCode,
	messageKey?: string,
	options?: AppErrorOptions
): AppError {
	return new AppError(code, messageKey, options);
}

/** Error for a request with no signed-in person. */
export const unauthorized = (messageKey?: string) => appError('UNAUTHORIZED', messageKey);
/** Error for someone without the Permission they need. */
export const forbidden = (messageKey?: string) => appError('FORBIDDEN', messageKey);
/** Error for something that doesn't exist. */
export const notFound = (messageKey?: string) => appError('NOT_FOUND', messageKey);
/** Error for a change that clashes with someone else's. */
export const conflict = (messageKey?: string) => appError('CONFLICT', messageKey);
/** Error for an action a business rule forbids. */
export const rule = (messageKey: string, params?: ErrorParams) =>
	appError('RULE', messageKey, { params });

/** One problem found by a form or input check. */
interface Issue {
	readonly message: string;
	readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
}

/** Groups input problems by field name. Problems with no field go under `_`. */
export function fieldErrorsFromIssues(issues: readonly Issue[]): FieldErrors {
	const result: FieldErrors = {};
	for (const issue of issues) {
		const field =
			issue.path
				?.map((segment) =>
					typeof segment === 'object' && segment !== null ? String(segment.key) : String(segment)
				)
				.join('.') || '_';
		(result[field] ??= []).push(issue.message);
	}
	return result;
}

/** Creates a validation error listing what is wrong with each field. */
export function validationError(issues: readonly Issue[]): AppError {
	return appError('VALIDATION', undefined, { fieldErrors: fieldErrorsFromIssues(issues) });
}

/** Turns a known failure into an AppError. Returns null for a real bug. */
export function toAppError(thrown: unknown): AppError | null {
	if (isAppError(thrown)) return thrown;
	if (thrown instanceof ZodError) return validationError(thrown.issues);
	return null;
}

/** Turns the outcome of an edit into an error: CONFLICT when someone saved first, NOT_FOUND when the record is gone. */
export function assertUpdated(result: UpdateResult): void {
	if (result === 'stale') throw conflict();
	if (result === 'missing') throw notFound();
}
