import { z } from 'zod';
import { idInput, listInput } from '#lib/server/core/index.ts';

const noteBody = z
	.string()
	.trim()
	.min(1, 'common_error_required')
	.max(500, 'common_error_too_long');

/** A new note. The screen makes the id, so sending it twice saves it once. */
export const addNoteInput = z.object({ id: idInput, body: noteBody });

/** An edit to a note, naming the version the editor started from. */
export const editNoteInput = z.object({
	id: idInput,
	version: z.coerce.number().int().min(1),
	body: noteBody
});

/** Which page of notes to show. */
export const listNotesInput = listInput;

export type AddNoteInput = z.output<typeof addNoteInput>;
export type EditNoteInput = z.output<typeof editNoteInput>;
