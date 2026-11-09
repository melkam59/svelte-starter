// Calls procedures the way a screen would, as an anonymous visitor or as a member with a starting Role.
import type { z } from 'zod';
import { client } from '#lib/server/db/index.ts';
import { callProcedure, type Access, type Procedure } from '#lib/server/modules/members/index.ts';
import { OWNER_ROLE_ID } from '#lib/shared/permissions.ts';
import { addMember } from './members.ts';

/** Who a test acts as. */
export type Who = 'anonymous' | 'Owner' | 'Admin' | 'Member';

let count = 0;

// An Install has exactly one Owner, so every Owner caller in a test is the same person.
async function existingOwner() {
	const [row] = await client<{ memberId: string; userId: string }[]>`
		select id as "memberId", user_id as "userId" from member where role_id = ${OWNER_ROLE_ID}`;
	return row ? { memberId: row.memberId, userId: row.userId } : null;
}

/** Makes a caller for a test. Admin and Member callers are new members each time; the Owner is shared. */
export async function callerAs(who: Who) {
	const member =
		who === 'anonymous'
			? null
			: (who === 'Owner' && (await existingOwner())) ||
				(await addMember({ email: `${who.toLowerCase()}-${++count}@test.et`, role: who }));
	return {
		memberId: member?.memberId ?? null,
		/** Runs a procedure as this caller. */
		call<S extends z.ZodType, O, A extends Access>(proc: Procedure<S, O, A>, input: z.input<S>) {
			return callProcedure(proc, caller, input);
		}
	};
}
