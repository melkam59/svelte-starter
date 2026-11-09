import { defineConfig } from '@playwright/test';

export default defineConfig({
	forbidOnly: !!process.env.CI,
	use: { baseURL: 'http://localhost:4173' },
	webServer: {
		command: 'pnpm run build && pnpm run preview',
		port: 4173,
		// The app must know its own address, as it does in production.
		env: { ORIGIN: 'http://localhost:4173' },
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	},
	testDir: 'tests',
	testMatch: '**/*.e2e.{ts,js}'
});
