import { timingSafeEqual } from 'node:crypto';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';
import type { ErrorCode } from '#lib/shared/errors.ts';
import { APP_VERSION, METRICS_TOKEN, SERVICE_NAME } from './config.ts';

/** Holds every metric served at /api/metrics. Each server process keeps its own counts; the `pid` label lets monitoring add them up. */
export const registry = new Registry();
registry.setDefaultLabels({
	service: SERVICE_NAME,
	version: APP_VERSION,
	pid: String(process.pid)
});
collectDefaultMetrics({ register: registry });

/** How long requests take, by method, route and status. */
export const httpRequestDuration = new Histogram({
	name: 'http_request_duration_seconds',
	help: 'HTTP request duration by route and status',
	labelNames: ['method', 'route', 'status'] as const,
	buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
	registers: [registry]
});

/** How many errors happened, by code and kind. */
export const appErrors = new Counter({
	name: 'app_errors_total',
	help: 'Errors returned to clients, by code and kind',
	labelNames: ['code', 'kind'] as const,
	registers: [registry]
});

export type ErrorKind = 'app' | 'validation' | 'framework' | 'unknown';

/** Adds one to the error count for a code and kind. */
export function countError(code: ErrorCode, kind: ErrorKind): void {
	appErrors.inc({ code, kind });
}

/** Records how long one request took. */
export function observeRequest(method: string, route: string, status: number, seconds: number) {
	httpRequestDuration.observe({ method, route, status: String(status) }, seconds);
}

/** Checks the metrics token. An empty METRICS_TOKEN turns metrics off. */
export function metricsAuthorized(authorization: string | null): boolean {
	if (!METRICS_TOKEN || !authorization?.startsWith('Bearer ')) return false;
	const given = Buffer.from(authorization.slice('Bearer '.length));
	const expected = Buffer.from(METRICS_TOKEN);
	return given.length === expected.length && timingSafeEqual(given, expected);
}
