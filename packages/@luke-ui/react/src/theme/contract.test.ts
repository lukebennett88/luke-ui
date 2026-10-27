import { describe, expect, it } from 'vite-plus/test';
import { vars } from './contract.css.js';
import {
	flattenThemeContract,
	modeFamilies,
	partitionContractPairs,
	spaceScale,
	themeContractTree,
} from './contract.js';
import type { IdentityPath, ModePath } from './contract.js';
import { SEMANTIC_ROLES } from './contrast-policy.js';
import { FONT_METRIC_SCALE } from './font-metric-scale.js';
import { typeStyles } from './type-styles.js';

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

	it('keeps the 24 non-rest interaction-state tokens and removes obsolete leaves', () => {
		const paths = flattenThemeContract().map(([path]) => path);
		const retained = paths.filter((path) => {
			return /^color\.(background\.\w+\.solid|foreground\.\w+)\.(hover|pressed)$/.test(path);
		});
		expect(retained).toHaveLength(24);
		expect(
			paths.some((path) => /color\.background\.\w+\.subtle\.(hover|pressed)$/.test(path)),
		).toBe(false);
		expect(paths).not.toContain('color.border.controlHover');
	});

	it('gives every semantic role the same background, foreground, and border leaves', () => {
		const leaf = (path: ModePath, varName: string): [ModePath, string] => [path, varName];
		const expected = SEMANTIC_ROLES.flatMap((role) => {
			const rows: Array<[ModePath, string]> = [
				leaf(`color.border.${role}`, `--luke-color-border-${role}`),
			];
			rows.push(
				leaf(`color.background.${role}.subtle.rest`, `--luke-color-background-${role}-subtle-rest`),
			);
			for (const prominence of ['solid'] as const) {
				for (const state of ['rest', 'hover', 'pressed'] as const) {
					rows.push(
						leaf(
							`color.background.${role}.${prominence}.${state}`,
							`--luke-color-background-${role}-${prominence}-${state}`,
						),
					);
				}
			}
			rows.push(
				leaf(`color.foreground.${role}.rest`, `--luke-color-foreground-${role}-rest`),
				leaf(`color.foreground.${role}.hover`, `--luke-color-foreground-${role}-hover`),
				leaf(`color.foreground.${role}.pressed`, `--luke-color-foreground-${role}-pressed`),
				leaf(
					`color.foreground.${role}.onSolid.primary`,
					`--luke-color-foreground-${role}-on-solid-primary`,
				),
				leaf(
					`color.foreground.${role}.onSolid.secondary`,
					`--luke-color-foreground-${role}-on-solid-secondary`,
				),
			);
			return rows;
		});
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
		expect([...emitted].toSorted(byPath)).toEqual([...expected].toSorted(byPath));
	});

	it('partitions identity and mode paths from the declared mode families', () => {
		expect(modeFamilies).toEqual(['color', 'controlFinish', 'depth', 'interaction']);
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

	it('exposes overlay backdrop as the only overlay leaf', () => {
		expect(vars.color.overlay).toEqual({
			backdrop: 'var(--luke-color-overlay-backdrop)',
		});
	});

	it('keeps the settled 1.0 surface, border, sizing, and type style leaves', () => {
		expect(Object.keys(vars.color.surface)).toEqual(['base', 'subdued', 'raised']);
		expect(Object.keys(vars.color.border).slice(0, 3)).toEqual(['decorative', 'control', 'focus']);
		expect(Object.keys(vars.controlFinish)).toEqual(['recessed', 'resting', 'raised']);
		expect(Object.keys(vars.controlSize)).toEqual(['px32', 'px40']);
		for (const style of typeStyles) {
			expect(Object.keys(vars.font[style]).toSorted()).toEqual([
				'fontFamily',
				'fontSize',
				'fontWeight',
				'letterSpacing',
				'lineHeight',
			]);
		}
		// Component geometry and font metrics are private, not public families.
		expect(Object.hasOwn(vars, 'iconSize')).toBe(false);
		expect(Object.hasOwn(vars, 'actionControlFinish')).toBe(false);
	});

	it('derives the spacing contract keys from the spacing scale', () => {
		expect(Object.keys(themeContractTree.space)).toEqual(
			Object.entries(spaceScale).map(([step]) => step),
		);
	});
});
