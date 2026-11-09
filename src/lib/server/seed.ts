// Fills a development database with what you need to try the app: Permissions, the starting Roles
// and one demo account per Role. Uses only the modules' setup entries and takes its database as an
// argument, so the seed script can run it under plain Node, outside SvelteKit.
import { hashPassword } from 'better-auth/crypto';
import type { Db } from '#lib/server/db/index.ts';
import {
	ensureMemberWithLogin,
	ensureStartingRoles,
	syncPermissions
} from '#lib/server/modules/members/members.setup.ts';

/** The demo accounts the seed creates, one per starting Role. */
export const demoAccounts = [
	{ email: 'owner@demo.com', name: 'Demo Owner', role: 'Owner' },
	{ email: 'admin@demo.com', name: 'Demo Admin', role: 'Admin' },
	{ email: 'member@demo.com', name: 'Demo Member', role: 'Member' }
] as const;

/**
 * Seeds the database. Safe to run again: accounts that already exist, including ones the developer
 * changed, are left alone. Refuses to run in production. Returns the emails of the accounts it created.
 */
export async function seedDevDatabase(
	db: Db,
	options: { nodeEnv: string | undefined; password: string }
): Promise<{ created: string[] }> {
	if (options.nodeEnv === 'production') {
		throw new Error('Refusing to seed: NODE_ENV is production.');
	}

	let hash: Promise<string> | undefined;
	const hashOnce = () => (hash ??= hashPassword(options.password));

	return db.transaction(async (tx) => {
		await syncPermissions(tx);
		await ensureStartingRoles(tx);

		const created: string[] = [];
		for (const account of demoAccounts) {
			const result = await ensureMemberWithLogin(tx, { ...account, hashPassword: hashOnce });
			if (result === 'created') created.push(account.email);
		}
		return { created };
	});
}
