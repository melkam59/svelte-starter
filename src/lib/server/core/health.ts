import { APP_VERSION } from './config.ts';

export type CheckResult = { ok: true; ms: number } | { ok: false; ms: number; error: string };

/** The result of the health checks. */
export interface HealthReport {
	status: 'ok' | 'degraded';
	version: string;
	uptimeSeconds: number;
	checks: Record<string, CheckResult>;
}

const timeoutMs = 2000;

async function timed(check: () => Promise<unknown>): Promise<CheckResult> {
	const startedAt = performance.now();
	try {
		await Promise.race([
			check(),
			new Promise((_, reject) => setTimeout(() => reject(new Error('timed out')), timeoutMs))
		]);
		return { ok: true, ms: Math.round(performance.now() - startedAt) };
	} catch (error) {
		return {
			ok: false,
			ms: Math.round(performance.now() - startedAt),
			error: error instanceof Error ? error.message : 'failed'
		};
	}
}

/** Runs the health checks at the same time. Any failure marks the app as not ok. */
export async function healthReport(
	checks: Record<string, () => Promise<unknown>>
): Promise<HealthReport> {
	const entries = await Promise.all(
		Object.entries(checks).map(async ([name, check]) => [name, await timed(check)] as const)
	);
	const results = Object.fromEntries(entries);
	return {
		status: entries.every(([, result]) => result.ok) ? 'ok' : 'degraded',
		version: APP_VERSION,
		uptimeSeconds: Math.round(process.uptime()),
		checks: results
	};
}
