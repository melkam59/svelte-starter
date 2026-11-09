import type { Reroute } from '@sveltejs/kit/hooks';
import { deLocalizeUrl } from '#lib/paraglide/runtime.js';

/** Removes the language prefix from a URL so routing ignores it. */
export const reroute: Reroute = (request) => deLocalizeUrl(request.url).pathname;
