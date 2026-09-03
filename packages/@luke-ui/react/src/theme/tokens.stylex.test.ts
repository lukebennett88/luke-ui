import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vite-plus/test';
import { flattenThemeContract } from './contract.js';
import { vars as publicVars } from './index.js';
import { vars } from './tokens.stylex.js';

function resolvePath(node: unknown, path: string): unknown {
	let value = node;
	for (const segment of path.split('.')) {
		if (typeof value !== 'object' || value === null) {
			throw new Error(`expected an object before "${segment}" in "${path}"`);
		}
		value = (value as Record<string, unknown>)[segment];
	}
	return value;
}

describe('StyleX tokens', () => {
	it('covers every theme contract leaf with a live var(--luke-*) reference at its nested path', () => {
		const pairs = flattenThemeContract();
		expect(pairs.length).toBe(183);

		for (const [path, variable] of pairs) {
			expect(resolvePath(vars, path)).toBe(`var(${variable})`);
		}
	});

	it('is the same object as the public theme export', () => {
		expect(publicVars).toBe(vars);
	});

	it('generates a single statically-analyzable nested object literal', async () => {
		const source = await readFile(new URL('./tokens.stylex.ts', import.meta.url), 'utf8');

		expect(source).toContain('export const vars = stylex.unstable_defineConstsNested({');
		expect(source.match(/unstable_defineConstsNested\(\{/g)?.length).toBe(1);
		expect(source).not.toMatch(/--luke-[^:]+:\s*#[0-9a-f]{3,8}/i);
	});

	it('does not emit a second token value set in the built stylesheet', async () => {
		const stylesheet = await readFile(
			new URL('../../dist/stylesheet.css', import.meta.url),
			'utf8',
		);
		const stylexSection = stylesheet.split('/* stylex */')[1] ?? '';
		expect(stylexSection).not.toMatch(/:root[^{]*\{[^}]*--luke-/);
	});
});
