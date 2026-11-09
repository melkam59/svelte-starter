// Where the integration tests keep their database. Imported by the Vitest config, so it uses no app code.
import { loadEnv } from 'vite';

/** Returns the test database URL: TEST_DATABASE_URL, or the dev DATABASE_URL pointed at a `app_test` database. Empty when neither is set, so a build without a database still works. */
export function testDatabaseUrl(): string {
	const env = { ...loadEnv('test', process.cwd(), ''), ...process.env };
	const explicit = env.TEST_DATABASE_URL;
	const base = explicit ?? env.DATABASE_URL;
	if (!base) return '';
	const url = new URL(base);
	if (!explicit) url.pathname = '/app_test';
	// The tests empty every table, so refuse anything that doesn't look like a test database.
	if (!url.pathname.endsWith('_test')) {
		throw new Error(
			`Integration tests need a database whose name ends in _test, not ${url.pathname}`
		);
	}
	return url.toString();
}
