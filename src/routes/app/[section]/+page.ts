import { error } from '@sveltejs/kit';
import { navItemFor } from '../nav.ts';
import type { PageLoad } from './$types';

/** Shows the placeholder for a planned screen, or a 404 for an unknown one. */
export const load: PageLoad = ({ params }) => {
	if (!navItemFor(params.section) || params.section === '') {
		error(404, { message: 'Not found', code: 'NOT_FOUND', messageKey: 'common_error_not_found' });
	}
	return { slug: params.section };
};
