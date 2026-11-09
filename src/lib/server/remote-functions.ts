// Turns procedures into remote functions the screens call. Each wrapper reads the caller from the
// request and leaves every check to the procedure, so screens and tests go through the same rules.
import { invalid } from '@sveltejs/kit';
import { command, form, getRequestEvent, query } from '$app/server';
import type { z } from 'zod';
import { isAppError } from '#lib/server/core/index.ts';
import {
	callProcedure,
	type Access,
	type Caller,
	type Procedure
} from '#lib/server/modules/members/index.ts';

// Which procedure each remote function runs, so a test can check every screen action has an access rule.
const procedures = new Map<unknown, Procedure>();

function register<R>(remote: R, proc: Procedure): R {
	procedures.set(remote, proc);
	return remote;
}

/** Returns the procedure a remote function runs, or undefined if it wasn't built from one. */
export function procedureOf(remote: unknown): Procedure | undefined {
	return procedures.get(remote);
}

/** Reads who is calling from the current request. */
export function callerFromRequest(): Caller {
	const event = getRequestEvent();
	return {
		userId: event.locals.user?.id ?? null,
		ip: event.getClientAddress(),
		requestId: event.locals.requestId
	};
}

/** A remote query that reads data through a procedure. */
export function asQuery<S extends z.ZodType, O, A extends Access>(proc: Procedure<S, O, A>) {
	return register(
		query('unchecked', (input: z.input<S>) => callProcedure(proc, callerFromRequest(), input)),
		proc as Procedure
	);
}

/** A remote command that changes data through a procedure. */
export function asCommand<S extends z.ZodType, O, A extends Access>(proc: Procedure<S, O, A>) {
	return register(
		command('unchecked', (input: z.input<S>) => callProcedure(proc, callerFromRequest(), input)),
		proc as Procedure
	);
}

/** A remote form that submits to a procedure. Field errors, from the input check or the procedure, show beside their inputs. */
export function asForm<S extends z.ZodObject, O, A extends Access>(proc: Procedure<S, O, A>) {
	// @ts-expect-error the form schema type demands optional booleans; procedures check their own input.
	const remote = form(proc.input, async (input: z.output<S>) => {
		try {
			return await callProcedure(proc, callerFromRequest(), input);
		} catch (error) {
			if (isAppError(error) && error.fieldErrors) {
				invalid(
					...Object.entries(error.fieldErrors).flatMap(([field, keys]) =>
						keys.map((message) => ({ message, path: field === '_' ? [] : field.split('.') }))
					)
				);
			}
			throw error;
		}
	});
	return register(remote, proc as Procedure);
}
