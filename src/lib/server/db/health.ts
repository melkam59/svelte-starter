import { ping } from './dialect.ts';
import { db } from './index.ts';

/** Checks that the database answers. The only database call routes may make directly. */
export function pingDatabase(): Promise<void> {
	return ping(db);
}
