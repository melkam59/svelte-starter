// Every action a screen can call must come from a procedure with a declared access rule, and this
// list must name each one. Adding a screen action means adding its line here, on purpose.
import { describe, expect, it } from 'vitest';
import { procedureOf } from '#lib/server/remote-functions.ts';

const expected: Record<string, string> = {
	'example.addNote': 'signed-in',
	'example.listNotes': 'signed-in',
	'members.saveMyLanguage': 'signed-in'
};

const remoteModules = import.meta.glob('/src/routes/**/*.remote.ts', { eager: true });

describe('permission matrix', () => {
	const found = Object.entries(remoteModules).flatMap(([file, exports]) =>
		Object.entries(exports as Record<string, unknown>).map(([name, remote]) => ({
			where: `${file}#${name}`,
			proc: procedureOf(remote)
		}))
	);

	it('builds every remote function from a procedure', () => {
		expect(found.filter((f) => !f.proc).map((f) => f.where)).toEqual([]);
	});

	it('lists every procedure the screens can reach, with its access rule', () => {
		const actual = Object.fromEntries(found.map((f) => [f.proc!.name, f.proc!.access]));
		expect(actual).toEqual(expected);
	});
});
