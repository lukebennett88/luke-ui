import { describe, expect, it } from 'vite-plus/test';
import { vars } from './contract.css.js';
import { flattenThemeContract, fontSizeSteps, themeContractTree } from './contract.js';
import { SEMANTIC_ROLES } from './contrast-policy.js';

function countLeaves(node: unknown): number {
	if (typeof node === 'string') return 1;
	if (!isRecord(node)) throw new Error('expected a nested theme contract object');

	let count = 0;
	for (const value of Object.values(node)) count += countLeaves(value);

	return count;
}

function resolvePath(node: unknown, path: string): unknown {
	let value = node;
	for (const segment of path.split('.')) {
		if (!isRecord(value)) throw new Error(`expected an object before "${segment}" in "${path}"`);
		value = value[segment];
	}

	return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

describe('theme contract', () => {
	it('resolves every typed path to its stable global variable', () => {
		const resolved = flattenThemeContract().map(([path]) => resolvePath(vars, path));
		expect(resolved).toEqual(flattenThemeContract().map(([, varName]) => `var(${varName})`));
	});

	it('has no typed paths beyond the flattened contract', () => {
		expect(countLeaves(vars)).toBe(flattenThemeContract().length);
	});

	it('gives all six semantic roles the same 60 leaves under the documented variable names', () => {
		// The migration table in the specification is a promise about these exact names, so they are
		// spelled out here rather than re-derived through `themeVarName` (which would only restate the
		// kebab-casing the contract already applied). `on-solid` is the one name a naive reading gets
		// wrong. Comparing the whole set, not a sample, also catches a seventh role or a stray leaf.
		const expected = SEMANTIC_ROLES.flatMap((role) => [
			[`color.border.${role}`, `--luke-color-border-${role}`],
			...['subtle', 'solid'].flatMap((prominence) =>
				['rest', 'hover', 'pressed'].map((state) => [
					`color.background.${role}.${prominence}.${state}`,
					`--luke-color-background-${role}-${prominence}-${state}`,
				]),
			),
			[`color.foreground.${role}.rest`, `--luke-color-foreground-${role}-rest`],
			[`color.foreground.${role}.hover`, `--luke-color-foreground-${role}-hover`],
			[`color.foreground.${role}.onSolid`, `--luke-color-foreground-${role}-on-solid`],
		]);
		const rolePaths = new Set(expected.map(([path]) => path));
		const emitted = flattenThemeContract().filter(([path]) => {
			return (
				path.startsWith('color.background.') ||
				path.startsWith('color.foreground.') ||
				rolePaths.has(path)
			);
		});

		expect(expected).toHaveLength(60);
		const byPath = (a: ReadonlyArray<string>, b: ReadonlyArray<string>) =>
			(a[0] ?? '').localeCompare(b[0] ?? '');
		expect([...emitted].sort(byPath)).toEqual([...expected].sort(byPath));
	});

	it('exposes font steps and the carried-forward icon-size scale', () => {
		expect(vars.font[100]).toEqual({
			baselineTrim: 'var(--luke-font-100-baseline-trim)',
			capHeightTrim: 'var(--luke-font-100-cap-height-trim)',
			fontSize: 'var(--luke-font-100-font-size)',
			letterSpacing: 'var(--luke-font-100-letter-spacing)',
			lineHeight: 'var(--luke-font-100-line-height)',
		});
		expect(vars.font[900].fontSize).toBe('var(--luke-font-900-font-size)');
		expect(vars.font.family).toEqual({
			body: 'var(--luke-font-family-body)',
			code: 'var(--luke-font-family-code)',
		});
		expect(vars.iconSize).toEqual({
			large: 'var(--luke-icon-size-large)',
			medium: 'var(--luke-icon-size-medium)',
			small: 'var(--luke-icon-size-small)',
			xsmall: 'var(--luke-icon-size-xsmall)',
		});
	});

	it('keeps fontSizeSteps as the single source of truth for the font contract keys', () => {
		const fontStepKeys = Object.keys(themeContractTree.font).filter((key) => {
			return key !== 'family' && key !== 'weight';
		});
		expect(fontSizeSteps).toEqual(fontStepKeys);
	});
});
