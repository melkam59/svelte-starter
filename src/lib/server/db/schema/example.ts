// The example module's table. It shows the house conventions for new tables.
import { index, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { createdAtColumn, idColumn, updatedAtColumn, versionColumn } from '../columns.ts';
import { member } from './members.ts';

/** Short notes members leave for each other. Here to show how a module is built; delete it when you start. */
export const exampleNote = pgTable(
	'example_note',
	{
		id: idColumn().primaryKey(),
		body: varchar('body', { length: 500 }).notNull(),
		authorMemberId: uuid('author_member_id')
			.notNull()
			.references(() => member.id, { onDelete: 'restrict' }),
		version: versionColumn(),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn()
	},
	(t) => [index('example_note_author_idx').on(t.authorMemberId)]
);
