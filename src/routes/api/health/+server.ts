import { pingDatabase } from '#lib/server/db/health.ts';
import { healthReport } from '#lib/server/core/index.ts';
import type { RequestHandler } from './$types';

/** Uptime check: answers "ok" or "not ok" and nothing else, so it reveals nothing about the app. */
export const GET: RequestHandler = async ({ locals }) => {
	const report = await healthReport({ database: pingDatabase });
	if (report.status !== 'ok') locals.log.warn({ checks: report.checks }, 'health check failed');
	const healthy = report.status === 'ok';
	return new Response(healthy ? 'ok' : 'not ok', {
		status: healthy ? 200 : 503,
		headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }
	});
};
