// The columns most tables share, so every table stores ids, versions and times the same way.
import { integer, timestamp, uuid } from 'drizzle-orm/pg-core';

/** A record id made by the screen (a version 7 UUID), so a repeated create saves once. */
export const idColumn = (name = 'id') => uuid(name);

/** Counts edits. An edit names the version it started from and is refused if someone saved in between. */
export const versionColumn = () => integer('version').notNull().default(1);

/** A point in time, stored with its time zone, to the millisecond. */
export const at = (name: string) => timestamp(name, { withTimezone: true, precision: 3 });

/** When the row was created. */
export const createdAtColumn = () => at('created_at').defaultNow().notNull();

/** When the row last changed. */
export const updatedAtColumn = () =>
	at('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull();
