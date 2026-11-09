import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { enhancedImages } from '@sveltejs/enhanced-img';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { sveltePhosphorOptimize } from 'phosphor-svelte/vite';
import { testDatabaseUrl } from './tests/support/test-database.ts';

// Under Vitest, the app's database is the test database. It is set here, before SvelteKit reads the
// environment, because a per-project `env` arrives too late and would leave tests on the dev database.
if (process.env.VITEST) {
	const url = testDatabaseUrl();
	if (url) process.env.DATABASE_URL = url;
	// Tests check behaviour, not log lines, so the server logs stay quiet.
	process.env.LOG_LEVEL ??= 'silent';
}

export default defineConfig({
	plugins: [
		enhancedImages(),
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
				experimental: { async: true }
			},

			adapter: adapter(),
			experimental: { remoteFunctions: true }
		}),

		sveltePhosphorOptimize(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			emitTsDeclarations: true,
			// The chosen language lives in the `language` cookie. With none yet, the base language,
			// English, applies. A test keeps both languages complete, so no message falls back.
			cookieName: 'language',
			strategy: ['cookie', 'baseLocale']
		})
	],
	test: {
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			include: ['src/**/*.{ts,svelte}'],
			// Generated code and the shadcn components are not ours to test.
			exclude: ['src/lib/paraglide/**', 'src/lib/components/ui/**', 'src/**/*.d.ts'],
			reporter: ['text-summary', 'text', 'html']
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['tests/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['tests/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['tests/**/*.{test,spec}.{js,ts}'],
					exclude: ['tests/**/*.svelte.{test,spec}.{js,ts}', 'tests/**/*.integration.spec.ts']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					// Tests that use a real Postgres database. They share one database, so files run one at a time.
					name: 'integration',
					environment: 'node',
					include: ['tests/**/*.integration.spec.ts'],
					globalSetup: ['tests/support/global-setup.ts'],
					setupFiles: ['tests/support/reset-database.ts'],
					fileParallelism: false,
					env: { LOG_LEVEL: 'silent' }
				}
			}
		]
	}
});
