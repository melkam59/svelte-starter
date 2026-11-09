import { describe, expect, it } from 'vitest';
import { addNote, editNote, listNotes } from '#lib/server/modules/example/index.ts';
import { newId } from '#lib/shared/ids.ts';
import { callerAs } from '../../../../support/callers.ts';

describe('example notes', () => {
	it('refuses an anonymous caller', async () => {
		const anonymous = await callerAs('anonymous');
		await expect(anonymous.call(listNotes, {})).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
	});

	it('saves a note once even when the same create is sent twice', async () => {
		const member = await callerAs('Member');
		const id = newId();
		await member.call(addNote, { id, body: 'Order more amoxicillin' });
		await member.call(addNote, { id, body: 'Order more amoxicillin' });

		const page = await member.call(listNotes, {});
		expect(page.items.map((n) => n.body)).toEqual(['Order more amoxicillin']);
	});

	it('accepts only version 7 ids, the kind the screens make', async () => {
		const member = await callerAs('Member');
		const version4 = '9b2d6c1e-3f4a-4b5c-8d6e-7f8091a2b3c4';
		await expect(
			member.call(addNote, { id: version4, body: 'Order more amoxicillin' })
		).rejects.toMatchObject({ code: 'VALIDATION', fieldErrors: { id: expect.anything() } });
	});

	it('puts the problem beside the field when the input is wrong', async () => {
		const member = await callerAs('Member');
		await expect(member.call(addNote, { id: newId(), body: '   ' })).rejects.toMatchObject({
			code: 'VALIDATION',
			fieldErrors: { body: ['common_error_required'] }
		});
	});

	it('pages through notes newest first with no repeats or gaps while notes are added', async () => {
		const member = await callerAs('Member');
		const start = Date.parse('2026-11-03T08:00:00Z');
		for (let i = 1; i <= 5; i++) {
			await member.call(addNote, { id: newId(new Date(start + i)), body: `note ${i}` });
		}

		const first = await member.call(listNotes, { limit: 2 });
		await member.call(addNote, { id: newId(new Date(start + 99)), body: 'added later' });
		const second = await member.call(listNotes, { limit: 2, cursor: first.nextCursor! });
		const third = await member.call(listNotes, { limit: 2, cursor: second.nextCursor! });

		expect([...first.items, ...second.items, ...third.items].map((n) => n.body)).toEqual([
			'note 5',
			'note 4',
			'note 3',
			'note 2',
			'note 1'
		]);
		expect(third.nextCursor).toBeNull();
	});

	it('saves an edit made from the latest version and refuses one made from an old version', async () => {
		const admin = await callerAs('Admin');
		const id = newId();
		await admin.call(addNote, { id, body: 'first' });

		await admin.call(editNote, { id, version: 1, body: 'second' });
		await expect(admin.call(editNote, { id, version: 1, body: 'third' })).rejects.toMatchObject({
			code: 'CONFLICT'
		});

		const [note] = (await admin.call(listNotes, {})).items;
		expect(note).toMatchObject({ body: 'second', version: 2 });
	});

	it('says NOT_FOUND when editing a note that does not exist', async () => {
		const admin = await callerAs('Admin');
		await expect(
			admin.call(editNote, { id: newId(), version: 1, body: 'x' })
		).rejects.toMatchObject({ code: 'NOT_FOUND' });
	});
});
