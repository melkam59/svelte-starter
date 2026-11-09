import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DATABASE_URL } from '#lib/server/core/config.ts';
import { createLogger } from '#lib/server/core/logger.ts';
import * as schema from './schema/index.ts';

const log = createLogger('db');

/** The Postgres connection pool. */
export const client = postgres(DATABASE_URL, { max: 10 });

/** The database client every repository uses. */
export const db = drizzle({ client, schema });

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export type Executor = Db | Tx;

// Closes the pool when the server shuts down.
process.once('sveltekit:shutdown', async () => {
	try {
		await client.end({ timeout: 5 });
		log.info('database pool closed');
	} catch (err) {
		log.warn({ err }, 'could not close database pool');
	}
});
