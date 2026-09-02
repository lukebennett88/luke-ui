import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vite-plus/test';
import { flattenThemeContract } from './contract.js';

describe('StyleX tokens', () => {
	it('covers every theme contract leaf with a live var(--luke-*) reference', async () => {
		const source = await readFile(new URL('./tokens.stylex.ts', import.meta.url), 'utf8');
		const pairs = flattenThemeContract();

		for (const [path, variable] of pairs) {
			const camelKey = toCamelCaseKey(path);
			expect(source).toContain(`${camelKey}: 'var(${variable})'`);
		}

		expect(source).toContain('export const vars = stylex.defineConsts({');
		expect(source.match(/defineConsts\(\{/g)?.length).toBe(1);
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

function toCamelCaseKey(path: string): string {
	const [first, ...rest] = path.split('.');
	if (first === undefined) throw new Error(`Theme contract path "${path}" is empty`);
	return first + rest.map((segment) => segment[0]?.toUpperCase() + segment.slice(1)).join('');
}
