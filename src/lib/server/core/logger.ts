import { pino, type Logger, type LoggerOptions } from 'pino';
import { APP_VERSION, dev, LOG_LEVEL, SERVICE_NAME } from './config.ts';

export type { Logger } from 'pino';

/** Fields that are hidden in logs. Add any new secret or personal field here. */
export const redactPaths = [
	'password',
	'*.password',
	'newPassword',
	'*.newPassword',
	'pin',
	'*.pin',
	'token',
	'*.token',
	'secret',
	'*.secret',
	'apiKey',
	'*.apiKey',
	'headers.authorization',
	'headers.cookie',
	'headers["set-cookie"]'
];

const options: LoggerOptions = {
	level: LOG_LEVEL ?? (dev ? 'debug' : 'info'),
	base: { service: SERVICE_NAME, version: APP_VERSION },
	redact: { paths: redactPaths, censor: '[redacted]' },
	formatters: { level: (label) => ({ level: label }) },
	timestamp: pino.stdTimeFunctions.isoTime,
	serializers: { err: pino.stdSerializers.err }
};

// In production, logs are JSON lines on stdout. In development, they're pretty-printed in
// the same process, because pino's background worker can't start inside Vite.
const stream = dev
	? (await import('pino-pretty')).default({
			colorize: true,
			translateTime: 'HH:MM:ss.l',
			ignore: 'pid,hostname,service,version'
		})
	: undefined;

/** The app-wide logger. */
export const logger: Logger = stream ? pino(options, stream) : pino(options);

/** Creates a logger tagged with a name, such as "db". */
export function createLogger(name: string, bindings: Record<string, unknown> = {}): Logger {
	return logger.child({ name, ...bindings });
}
