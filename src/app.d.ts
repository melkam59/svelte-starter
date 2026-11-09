import type { Session, User } from 'better-auth';
import type { ErrorCode, ErrorParams, FieldErrors } from '#lib/shared/errors.ts';
import type { Logger } from '#lib/server/core/index.ts';

// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		/** The body of every error the screens receive. Same shape as `ErrorBody`. */
		interface Error {
			message: string;
			code: ErrorCode;
			messageKey: string;
			params?: ErrorParams;
			fieldErrors?: FieldErrors;
			requestId?: string;
		}
		interface Locals {
			requestId: string;
			log: Logger;
			user?: User;
			session?: Session;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
