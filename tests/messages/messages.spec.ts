import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json' with { type: 'json' };
import am from '../../messages/am.json' with { type: 'json' };

const keys = (messages: Record<string, string>) =>
	Object.keys(messages).filter((key) => key !== '$schema');

describe('translations', () => {
	it('has every English message in Amharic', () => {
		expect(keys(en).filter((key) => !(key in am))).toEqual([]);
	});

	it('has every Amharic message in English', () => {
		expect(keys(am).filter((key) => !(key in en))).toEqual([]);
	});

	it('has no empty message in either language', () => {
		const empty = [en, am].flatMap((messages) =>
			keys(messages).filter((key) => !(messages as Record<string, string>)[key]?.trim())
		);
		expect(empty).toEqual([]);
	});
});

// Message keys named in code: `messageKey` arguments, `rule(...)` keys and schema messages such as
// `min(1, 'common_error_required')`. Each is a quoted snake_case word starting with a known prefix.
const keyInCode =
	/['"`]((?:common|auth|nav|sign_in|user_menu|app|member|settings|example)_[a-z0-9_]+)['"`]/g;

// Generated messages, table and index names, and metric names look like keys but are not.
const skipped = ['src/lib/paraglide', 'src/lib/server/db', 'src/lib/server/core/metrics.ts'];

function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return skipped.includes(path) ? [] : sourceFiles(path);
		return /\.(ts|svelte)$/.test(entry.name) && !skipped.includes(path) ? [path] : [];
	});
}

describe('message keys used in code', () => {
	it('exist in both languages', () => {
		const missing = sourceFiles('src').flatMap((file) =>
			[...readFileSync(file, 'utf8').matchAll(keyInCode)]
				.map(([, key]) => key!)
				.filter((key) => !(key in en) || !(key in am))
				.map((key) => `${key} (${file})`)
		);
		expect([...new Set(missing)]).toEqual([]);
	});
});
