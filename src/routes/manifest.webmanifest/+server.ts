import { APP_NAME } from '#lib/server/core/index.ts';
import { getLocale } from '#lib/paraglide/runtime.js';
import type { RequestHandler } from './$types';

/** Describes the installed app (PWA). Add icons to `static/` and list them here. */
export const GET: RequestHandler = () => {
	const manifest = {
		name: APP_NAME,
		short_name: APP_NAME,
		lang: getLocale(),
		start_url: '/app',
		scope: '/',
		display: 'standalone',
		background_color: '#ffffff',
		icons: []
	};
	return new Response(JSON.stringify(manifest), {
		headers: { 'content-type': 'application/manifest+json', 'cache-control': 'no-cache' }
	});
};
