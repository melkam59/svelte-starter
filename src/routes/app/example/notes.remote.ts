import { asForm, asQuery } from '#lib/server/remote-functions.ts';
import { addNote, listNotes } from '#lib/server/modules/example/index.ts';
import { devOnly } from '#lib/server/modules/members/index.ts';

// The example screen exists only while developing, so its actions answer NOT_FOUND in production.

/** One page of notes. */
export const notes = asQuery(devOnly(listNotes));

/** The form that adds a note. */
export const noteForm = asForm(devOnly(addNote));
