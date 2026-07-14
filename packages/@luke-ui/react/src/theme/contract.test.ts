import { describe, expect, it } from 'vite-plus/test';
import { vars } from './contract.css.js';
import { flattenThemeContract } from './contract.js';

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

	it('exposes font steps and the carried-forward icon-size scale', () => {
		expect(vars.font[100]).toEqual({
			baselineTrim: 'var(--luke-font-100-baseline-trim)',
			capHeightTrim: 'var(--luke-font-100-cap-height-trim)',
			fontSize: 'var(--luke-font-100-font-size)',
			letterSpacing: 'var(--luke-font-100-letter-spacing)',
			lineHeight: 'var(--luke-font-100-line-height)',
		});
		expect(vars.font[900].fontSize).toBe('var(--luke-font-900-font-size)');
		expect(vars.iconSize).toEqual({
			large: 'var(--luke-icon-size-large)',
			medium: 'var(--luke-icon-size-medium)',
			small: 'var(--luke-icon-size-small)',
			xsmall: 'var(--luke-icon-size-xsmall)',
		});
	});
});
