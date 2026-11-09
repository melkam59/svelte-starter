import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';

const logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'] as const;

/** Environment variables the app needs, checked when the server starts. */
export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Postgres connection string, e.g. `postgres://app:app@localhost:5432/app`.',
		schema: z.url({ protocol: /^postgres(ql)?$/ })
	},
	ORIGIN: {
		description: 'The app origin (base URL), e.g. `http://localhost:5173`.'
	},
	BETTER_AUTH_SECRET: {
		description:
			'Secret used to sign tokens. Use 32+ characters generated with high entropy (`openssl rand -base64 32`).'
	},
	LOG_LEVEL: {
		description: 'pino log level. Defaults to `debug` in dev and `info` in production.',
		schema: z.enum(logLevels).optional()
	},
	APP_NAME: {
		description: 'The name people see in the title bar, sidebar and sign-in page.',
		schema: z.string().min(1).default('Starter')
	},
	SERVICE_NAME: {
		description: 'Name stamped on every log line and metric. Defaults to `app`.',
		schema: z.string().min(1).default('app')
	},
	APP_VERSION: {
		description:
			'Release version on every log line and metric. Set by the deploy; defaults to `dev`.',
		schema: z.string().min(1).default('dev')
	},
	METRICS_TOKEN: {
		description:
			'Bearer token for GET /api/metrics. Empty disables the endpoint. Use 32+ random characters.',
		schema: z.union([z.literal(''), z.string().min(32)]).default('')
	}
});
