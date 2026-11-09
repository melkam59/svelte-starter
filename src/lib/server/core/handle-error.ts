import type { ErrorBody } from '#lib/shared/errors.ts';
import { codeForStatus, fallbackError, messageKeyFor } from '#lib/shared/errors.ts';
import { dev } from './config.ts';
import { fieldErrorsFromIssues, toAppError } from './errors.ts';
import type { Logger } from './logger.ts';
import { countError } from './metrics.ts';

type Issue = Parameters<typeof fieldErrorsFromIssues>[0][number];

export type Caught =
	| { kind: 'app'; error: App.Error; issues?: undefined }
	| { kind: 'framework'; error: { status: number; message: string }; issues?: undefined }
	| { kind: 'validation'; error: { status: number; message: string }; issues: Issue[] }
	| { kind: 'unknown'; error: unknown; issues?: undefined };

/** An error ready to send: its body, status and how serious it is. */
export interface Shaped {
	status?: number;
	body: ErrorBody;
}

/** Turns anything thrown on the server into what the client may see. Never throws and never shows stack traces or SQL. */
export function shapeError(caught: Caught, requestId?: string): Shaped {
	switch (caught.kind) {
		case 'app':
			return { body: { ...caught.error, requestId } };

		case 'validation':
			return {
				status: 400,
				body: {
					message: 'Check the highlighted fields',
					code: 'VALIDATION',
					messageKey: messageKeyFor('VALIDATION'),
					fieldErrors: fieldErrorsFromIssues(caught.issues),
					requestId
				}
			};

		case 'framework': {
			const code = codeForStatus(caught.error.status);
			return {
				body: { message: caught.error.message, code, messageKey: messageKeyFor(code), requestId }
			};
		}

		case 'unknown': {
			const known = toAppError(caught.error);
			if (known) return { status: known.status, body: known.toBody(requestId) };
			const message =
				dev && caught.error instanceof Error ? caught.error.message : fallbackError.message;
			return { status: 500, body: { ...fallbackError, message, requestId } };
		}
	}
}

/** Logs and counts an error at the right level. */
export function reportError(caught: Caught, shaped: Shaped, log: Logger): void {
	const { code } = shaped.body;
	const isBug = caught.kind === 'unknown' && code === 'INTERNAL';
	countError(code, isBug ? 'unknown' : caught.kind === 'unknown' ? 'app' : caught.kind);

	if (isBug) {
		log.error({ err: caught.error }, 'unhandled server error');
	} else if (caught.kind !== 'framework' || code !== 'NOT_FOUND') {
		log.info({ code, messageKey: shaped.body.messageKey, kind: caught.kind }, 'request failed');
	}
}
