import { metricsAuthorized, notFound, registry } from '#lib/server/core/index.ts';
import type { RequestHandler } from './$types';

/** Serves metrics for monitoring. Needs the METRICS_TOKEN; anyone else gets a 404. */
export const GET: RequestHandler = async ({ request }) => {
	if (!metricsAuthorized(request.headers.get('authorization'))) throw notFound();
	return new Response(await registry.metrics(), {
		headers: { 'content-type': registry.contentType, 'cache-control': 'no-store' }
	});
};
