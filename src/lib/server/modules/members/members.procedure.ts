// Every server action is a procedure: an input check, who may call it, and what it does. Screens reach
// procedures through remote functions; tests call them directly as any Role.
import type { z } from 'zod';
import { appError, dev, notFound, validationError } from '#lib/server/core/index.ts';
import { recordLater } from '#lib/server/modules/activity-log/index.ts';
import type { PermissionCode } from '#lib/shared/permissions.ts';
import { can, currentMember } from './members.service.ts';
import type { CurrentMember } from './members.types.ts';

/** Who may call a procedure: anyone, any signed-in active member, only the Owner, or only holders of one Permission. */
export type Access = 'anyone' | 'signed-in' | 'owner' | PermissionCode;

/** Who is calling and from where, as read from the request. */
export interface Caller {
	/** The signed-in login, or null for an anonymous caller. */
	userId: string | null;
	ip: string;
	requestId?: string;
}

/** What a procedure knows about its caller. `me` is only null for procedures open to anyone. */
export interface ProcedureContext<A extends Access = Access> {
	me: A extends 'anyone' ? CurrentMember | null : CurrentMember;
	ip: string;
	requestId?: string;
}

/** A server action with its input check and access rule. */
export interface Procedure<
	S extends z.ZodType = z.ZodType,
	O = unknown,
	A extends Access = Access
> {
	readonly name: string;
	readonly access: A;
	readonly input: S;
	readonly run: (input: z.output<S>, ctx: ProcedureContext<A>) => Promise<O>;
}

/** Defines a procedure. The name, such as `example.addNote`, appears in logs. */
export function procedure<S extends z.ZodType, O, A extends Access>(
	name: string,
	definition: Omit<Procedure<S, O, A>, 'name'>
): Procedure<S, O, A> {
	return { name, ...definition };
}

/** Runs a procedure for a caller: checks who they are, then their Permission, then the input. */
export async function callProcedure<S extends z.ZodType, O, A extends Access>(
	proc: Procedure<S, O, A>,
	caller: Caller,
	rawInput: unknown
): Promise<O> {
	const me = caller.userId ? await currentMember(caller.userId) : null;
	if (proc.access !== 'anyone') {
		if (!me) throw appError('UNAUTHORIZED');
		const allowed =
			proc.access === 'signed-in' || (proc.access === 'owner' ? me.isOwner : can(me, proc.access));
		if (!allowed) {
			await recordLater({
				type: 'authz.denied',
				actorMemberId: me.id,
				ip: caller.ip,
				after: { procedure: proc.name, needs: proc.access }
			});
			throw appError('FORBIDDEN');
		}
	}
	const parsed = proc.input.safeParse(rawInput);
	if (!parsed.success) throw validationError(parsed.error.issues);

	const ctx = { me, ip: caller.ip, requestId: caller.requestId };
	return proc.run(parsed.data, ctx as ProcedureContext<A>);
}

/**
 * Wraps a procedure that exists only while developing, such as the example screen's actions.
 * Outside development it answers NOT_FOUND, as if it did not exist.
 */
export function devOnly<S extends z.ZodType, O, A extends Access>(
	proc: Procedure<S, O, A>,
	enabled: boolean = dev
): Procedure<S, O, A> {
	return {
		...proc,
		run: (input, ctx) => (enabled ? proc.run(input, ctx) : Promise.reject(notFound()))
	};
}
