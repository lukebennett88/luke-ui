import { describe, expect, it } from 'vite-plus/test';
import { vars } from './contract.css.js';
import {
	flattenThemeContract,
	modeFamilies,
	partitionContractPairs,
	spaceScale,
	themeContractTree,
	typeStyles,
} from './contract.js';
import type { IdentityPath, ModePath } from './contract.js';
import { SEMANTIC_ROLES } from './contrast-policy.js';
import { FONT_METRIC_SCALE } from './font-metric-scale.js';

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

	it('gives every semantic role the same documented contract leaves', () => {
		// The migration table in the specification is a promise about these exact names, so they are
		// spelled out here rather than re-derived through `themeVarName` (which would only restate the
		// kebab-casing the contract already applied). `on-solid` is the one name a naive reading gets
		// wrong. Comparing the whole set, not a sample, also catches a seventh role or a stray leaf.
		const leaf = (path: ModePath, varName: string): [ModePath, string] => [path, varName];
		const expected = SEMANTIC_ROLES.flatMap((role) => [
			leaf(`color.border.${role}`, `--luke-color-border-${role}`),
			leaf(`color.background.${role}.subtle`, `--luke-color-background-${role}-subtle`),
			leaf(`color.background.${role}.solid`, `--luke-color-background-${role}-solid`),
			leaf(`color.foreground.${role}.default`, `--luke-color-foreground-${role}-default`),
			leaf(`color.foreground.${role}.onSolid`, `--luke-color-foreground-${role}-on-solid`),
		]);
		const rolePaths = new Set<string>(expected.map(([path]) => path));
		const emitted = flattenThemeContract().filter(([path]) => {
			return (
				path.startsWith('color.background.') ||
				path.startsWith('color.foreground.') ||
				rolePaths.has(path)
			);
		});

		const byPath = (a: ReadonlyArray<string>, b: ReadonlyArray<string>) => {
			return (a[0] ?? '').localeCompare(b[0] ?? '');
		};
		expect([...emitted].sort(byPath)).toEqual([...expected].sort(byPath));
	});

	it('partitions identity and mode paths from the declared mode families', () => {
		expect(modeFamilies).toEqual(['actionControlFinish', 'color', 'depth']);
		const pairs = flattenThemeContract();
		const { identityPairs, modePairs } = partitionContractPairs(pairs);
		expect(identityPairs.length + modePairs.length).toBe(pairs.length);

		const modePaths: Array<ModePath> = modePairs.map(([path]) => path);
		const identityPaths: Array<IdentityPath> = identityPairs.map(([path]) => path);
		for (const path of modePaths) {
			expect(modeFamilies).toContain(path.split('.')[0]);
		}
		for (const path of identityPaths) {
			expect(modeFamilies).not.toContain(path.split('.')[0]);
		}
	});

	it('keeps typeStyles as the single source of truth for the font contract keys', () => {
		const fontStepKeys = Object.keys(themeContractTree.font).filter((key) => {
			return key !== 'family' && key !== 'weight';
		});
		expect(typeStyles).toEqual(fontStepKeys);
	});

	it('keeps literal typography metrics internal while public tokens stay semantic', () => {
		for (const step of Object.keys(FONT_METRIC_SCALE)) {
			expect(Object.hasOwn(vars.font, step)).toBe(false);
		}
		for (const style of typeStyles) {
			expect(Object.hasOwn(vars.font, style)).toBe(true);
		}
	});

	it('exposes overlay backdrop only, and does not emit hover, pressed, tint, or scrim', () => {
		const pairs = flattenThemeContract();
		const byPath = new Map(pairs);

		expect(byPath.get('color.overlay.backdrop')).toBe('--luke-color-overlay-backdrop');
		expect(byPath.get('color.surface.overlay')).toBe('--luke-color-surface-overlay');
		expect(vars.color.overlay).toEqual({
			backdrop: 'var(--luke-color-overlay-backdrop)',
		});
		expect(byPath.has('color.overlay.hover')).toBe(false);
		expect(byPath.has('color.overlay.pressed')).toBe(false);
		expect(byPath.has('color.overlay.tint')).toBe(false);
		expect(pairs.some(([, varName]) => varName === '--luke-color-overlay-tint')).toBe(false);
		expect(byPath.has('color.scrim')).toBe(false);
		expect(pairs.some(([, varName]) => varName === '--luke-color-scrim')).toBe(false);
		expect(Object.hasOwn(vars.color, 'scrim')).toBe(false);
	});

	it('does not emit per-role background hover or pressed leaves', () => {
		const pairs = flattenThemeContract();
		const backgroundPaths = pairs
			.map(([path]) => path)
			.filter((path) => {
				return path.startsWith('color.background.');
			});

		expect(
			backgroundPaths.some((path) => path.endsWith('.hover') || path.endsWith('.pressed')),
		).toBe(false);
		expect(backgroundPaths.some((path) => path.endsWith('.rest'))).toBe(false);
		expect(pairs.some(([, varName]) => varName.includes('-solid-hover'))).toBe(false);
		expect(pairs.some(([, varName]) => varName.includes('-subtle-pressed'))).toBe(false);
	});

	it('defines the selected spacing steps from the 4px scale', () => {
		expect(spaceScale).toEqual([
			['100', '4px'],
			['200', '8px'],
			['300', '12px'],
			['400', '16px'],
			['600', '24px'],
			['800', '32px'],
			['1000', '40px'],
			['1200', '48px'],
			['1600', '64px'],
		]);
	});

	it('derives the spacing contract keys from the spacing scale', () => {
		expect(Object.keys(themeContractTree.space)).toEqual(spaceScale.map(([step]) => step));
	});
});
