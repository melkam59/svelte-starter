// The example module shows the four house conventions: application errors, paged lists,
// creates that are safe to repeat, and edits refused when someone else saved first.
import { assertUpdated, pageOf } from '#lib/server/core/index.ts';
import { db } from '#lib/server/db/index.ts';
import { procedure } from '#lib/server/modules/members/index.ts';
import * as repo from './example.repository.ts';
import { addNoteInput, editNoteInput, listNotesInput } from './example.schema.ts';

/** Adds a note by the signed-in member. Repeating it with the same id changes nothing. */
export const addNote = procedure('example.addNote', {
	access: 'note:write',
	input: addNoteInput,
	async run(input, { me }) {
		await repo.insertNote(db, { id: input.id, body: input.body, authorMemberId: me.id });
		return { id: input.id };
	}
});

/** Changes a note's text. Refused with CONFLICT if someone saved it after the editor opened it. */
export const editNote = procedure('example.editNote', {
	access: 'note:write',
	input: editNoteInput,
	async run(input) {
		assertUpdated(await repo.updateNote(db, input, input.body));
		return { id: input.id, version: input.version + 1 };
	}
});

/** Lists notes, newest first, one page at a time. */
export const listNotes = procedure('example.listNotes', {
	access: 'note:read',
	input: listNotesInput,
	async run(input) {
		const rows = await repo.listNotes(db, input);
		return pageOf(rows, input.limit, (row) => row.id);
	}
});
