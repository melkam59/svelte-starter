import { APP_NAME } from '#lib/server/core/index.ts';
import type { LayoutServerLoad } from './$types';

/** Gives every page the app's name. */
export const load: LayoutServerLoad = () => ({ appName: APP_NAME });
