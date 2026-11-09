import { m } from '#lib/paraglide/messages.js';
import { errorOf, messageKeyFor, type ErrorBody } from '#lib/shared/errors.ts';

type Message = (params?: Record<string, string | number>) => string;
const messages = m as unknown as Record<string, Message | undefined>;

/** Returns the translated message for an error, or the generic one for its code. Never shows a raw key. */
export function errorMessage(thrown: unknown): string {
	const error: ErrorBody = errorOf(thrown);
	const translate = messages[error.messageKey] ?? messages[messageKeyFor(error.code)];
	return translate ? translate(error.params) : error.message;
}

/** Returns the translated messages for one form field. */
export function fieldMessages(thrown: unknown, field: string): string[] {
	const keys = errorOf(thrown).fieldErrors?.[field] ?? [];
	return keys.map((key) => messages[key]?.() ?? key);
}

/** Returns the translated messages for the problems a remote form found in one field. */
export function issueMessages(issues: readonly { message: string }[] | undefined): string[] {
	return (issues ?? []).map(({ message }) => messages[message]?.() ?? message);
}
