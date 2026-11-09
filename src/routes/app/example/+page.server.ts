import { dev, notFound } from '#lib/server/core/index.ts';
import type { PageServerLoad } from './$types';

/** The example screen exists only while developing. */
export const load: PageServerLoad = () => {
	if (!dev) throw notFound();
};
