import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vite-plus/test';
import { flattenThemeContract } from './contract.js';
import { buildPandaTokens, buildTokenMapping, classifyLeaf, vars } from './panda-tokens.js';

/** Flattens a nested token group into `[shorthandPath, value]` pairs. */
function flattenTokens(node: unknown, prefix: Array<string> = []): Array<[string, string]> {
	if (isTokenLeaf(node)) return [[prefix.join('.'), node.value]];
	if (!isRecord(node)) throw new Error(`expected a token group at "${prefix.join('.')}"`);

	const pairs: Array<[string, string]> = [];
	for (const [key, value] of Object.entries(node)) {
		pairs.push(...flattenTokens(value, [...prefix, key]));
	}

	return pairs;
}

function resolvePath(node: unknown, path: string): unknown {
	let value = node;
	for (const segment of path.split('.')) {
		if (!isRecord(value)) throw new Error(`expected an object before "${segment}" in "${path}"`);
		value = value[segment];
	}

	return value;
}

/** Whether a leaf path (top segment) is a raw pass-through per the tree: `actionControlFinish.*`, or under `font` but not `font.weight`. */
function isRawPath(segments: Array<string>): boolean {
	if (segments[0] === 'actionControlFinish') return true;
	if (segments[0] === 'font' && segments[1] !== 'weight') return true;

	return false;
}

function isTokenLeaf(value: unknown): value is { value: string } {
	return isRecord(value) && typeof value.value === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

describe('panda tokens', () => {
	it('classifies every leaf as exactly mapped-or-raw, with the raw set derived from the tree', () => {
		for (const [path] of flattenThemeContract()) {
			const segments = path.split('.');
			const classification = classifyLeaf(segments);
			if (isRawPath(segments)) {
				expect(classification, path).toBeNull();
			} else {
				expect(classification, path).not.toBeNull();
			}
		}
	});

	it('has unique shorthands within each Panda category', () => {
		const seen = new Map<string, Set<string>>();
		for (const [path] of flattenThemeContract()) {
			const classification = classifyLeaf(path.split('.'));
			if (classification === null) continue;
			const shorthands = seen.get(classification.category) ?? new Set<string>();
			expect(
				shorthands.has(classification.shorthand),
				`${classification.category}.${classification.shorthand}`,
			).toBe(false);
			shorthands.add(classification.shorthand);
			seen.set(classification.category, shorthands);
		}
	});

	it('emits one Panda token per mapped leaf, each valued as its var(--luke-*) reference', () => {
		const tokens = buildPandaTokens();
		const emitted = new Map<string, string>();
		for (const [category, group] of Object.entries(tokens)) {
			for (const [shorthand, value] of flattenTokens(group)) {
				emitted.set(`${category}.${shorthand}`, value);
			}
		}

		const expected = new Map<string, string>();
		for (const [path, varName] of flattenThemeContract()) {
			const classification = classifyLeaf(path.split('.'));
			if (classification === null) continue;
			expected.set(`${classification.category}.${classification.shorthand}`, `var(${varName})`);
		}

		expect(emitted).toEqual(expected);
	});

	it('builds a token() expression for every mapped leaf', () => {
		const mapping = buildTokenMapping();
		for (const [path] of flattenThemeContract()) {
			const classification = classifyLeaf(path.split('.'));
			if (classification === null) continue;
			expect(mapping[path]?.token).toBe(
				`token('${classification.category}.${classification.shorthand}')`,
			);
		}
	});

	it('preserves the shape-preserving vars successor', () => {
		const resolved = flattenThemeContract().map(([path]) => resolvePath(vars, path));
		expect(resolved).toEqual(flattenThemeContract().map(([, varName]) => `var(${varName})`));

		expect(vars.font[100]).toEqual({
			baselineTrim: 'var(--luke-font-100-baseline-trim)',
			capHeightTrim: 'var(--luke-font-100-cap-height-trim)',
			fontSize: 'var(--luke-font-100-font-size)',
			letterSpacing: 'var(--luke-font-100-letter-spacing)',
			lineHeight: 'var(--luke-font-100-line-height)',
		});
		expect(vars.iconSize).toEqual({
			large: 'var(--luke-icon-size-large)',
			medium: 'var(--luke-icon-size-medium)',
			small: 'var(--luke-icon-size-small)',
			xsmall: 'var(--luke-icon-size-xsmall)',
		});
		expect(vars.actionControlFinish.recessed).toBe('var(--luke-action-control-finish-recessed)');
		expect(vars.space[100]).toBe('var(--luke-space-100)');
	});

	it('matches the committed token-map.json', () => {
		const committed = JSON.parse(
			readFileSync(new URL('./token-map.json', import.meta.url), 'utf8'),
		);
		expect(committed).toEqual(buildTokenMapping());
	});
});
