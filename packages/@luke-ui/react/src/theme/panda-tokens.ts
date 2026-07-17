import { flattenThemeContract, themeContractTree } from './contract.js';

/**
 * A single category rule. `prefix` is matched against a leaf path's leading segments; the
 * longest matching prefix wins. `drop` is the number of leading segments stripped to form the
 * Panda shorthand, so `controlSize`/`iconSize` (drop 0) keep their source key and stay unique
 * within `sizes`.
 */
export interface CategoryRule {
	readonly prefix: ReadonlyArray<string>;
	readonly category: string;
	readonly drop: number;
}

/**
 * Maps contract leaves to Panda token categories by longest-matching-prefix. Every leaf matching
 * no rule is a raw pass-through (not a Panda token): `actionControlFinish.*`, the `font.100..900.*`
 * Capsize composites, and `font.family`.
 */
export const categoryRules: ReadonlyArray<CategoryRule> = [
	{ prefix: ['color'], category: 'colors', drop: 1 },
	{ prefix: ['depth'], category: 'shadows', drop: 1 },
	{ prefix: ['space'], category: 'spacing', drop: 1 },
	{ prefix: ['radius'], category: 'radii', drop: 1 },
	{ prefix: ['controlSize'], category: 'sizes', drop: 0 },
	{ prefix: ['iconSize'], category: 'sizes', drop: 0 },
	{ prefix: ['motion', 'duration'], category: 'durations', drop: 2 },
	{ prefix: ['motion', 'easing'], category: 'easings', drop: 2 },
	{ prefix: ['font', 'weight'], category: 'fontWeights', drop: 2 },
];

/** A matched leaf's Panda category plus its shorthand path within that category. */
export interface Classification {
	readonly category: string;
	readonly shorthand: string;
}

/**
 * Classifies one leaf path's segments, returning its Panda `{ category, shorthand }` (longest
 * matching prefix wins) or `null` for a raw pass-through leaf.
 */
export function classifyLeaf(segments: ReadonlyArray<string>): Classification | null {
	let best: CategoryRule | null = null;
	for (const rule of categoryRules) {
		if (rule.prefix.length > segments.length) continue;
		const matches = rule.prefix.every((segment, index) => segments[index] === segment);
		if (!matches) continue;
		if (best === null || rule.prefix.length > best.prefix.length) best = rule;
	}
	if (best === null) return null;

	return { category: best.category, shorthand: segments.slice(best.drop).join('.') };
}

/** Walks `segments`, creating intermediate plain objects, then assigns `leaf` at the final key. */
function setPath(
	target: Record<string, unknown>,
	segments: ReadonlyArray<string>,
	leaf: unknown,
): void {
	let node = target;
	const lastIndex = segments.length - 1;
	for (let index = 0; index < lastIndex; index++) {
		const key = segments[index]!;
		const next = node[key];
		if (next === undefined) {
			const created: Record<string, unknown> = {};
			node[key] = created;
			node = created;
		} else {
			node = next as Record<string, unknown>;
		}
	}
	node[segments[lastIndex]!] = leaf;
}

/**
 * Recursively mirrors the shape of the semantic token tree, turning `null` leaves into `string`
 * references and objects into nested records.
 */
type ThemeVars<T> = {
	[K in keyof T]: T[K] extends null ? string : ThemeVars<T[K]>;
};

function buildVars(): ThemeVars<typeof themeContractTree> {
	const result: Record<string, unknown> = {};
	for (const [path, varName] of flattenThemeContract()) {
		setPath(result, path.split('.'), `var(${varName})`);
	}

	return result as ThemeVars<typeof themeContractTree>;
}

/**
 * Typed access to the semantic theme custom properties. Each path resolves to a stable global
 * `--luke-*` variable reference, for example `vars.color.intent.danger.surface.solidHover` is
 * `var(--luke-color-intent-danger-surface-solid-hover)`. Emits no CSS; values are supplied by a
 * theme stylesheet built with `buildTheme`.
 */
export const vars = buildVars();

/** A Panda token leaf. */
export interface PandaToken {
	value: string;
}

/** A Panda token group: nested groups or token leaves, keyed by name. */
export interface PandaTokenGroup {
	[key: string]: PandaToken | PandaTokenGroup;
}

/** The Panda `theme.tokens` alias layer emitted from the semantic contract. */
export interface PandaAliasTokens {
	colors: PandaTokenGroup;
	shadows: PandaTokenGroup;
	spacing: PandaTokenGroup;
	radii: PandaTokenGroup;
	sizes: PandaTokenGroup;
	durations: PandaTokenGroup;
	easings: PandaTokenGroup;
	fontWeights: PandaTokenGroup;
}

/**
 * Builds the Panda `theme.tokens` alias layer. Each mapped leaf becomes `{ value: 'var(--luke-*)' }`
 * placed at its shorthand path within its category; raw leaves are excluded.
 */
export function buildPandaTokens(): PandaAliasTokens {
	const tokens: Record<string, Record<string, unknown>> = {
		colors: {},
		shadows: {},
		spacing: {},
		radii: {},
		sizes: {},
		durations: {},
		easings: {},
		fontWeights: {},
	};
	for (const [path, varName] of flattenThemeContract()) {
		const classification = classifyLeaf(path.split('.'));
		if (classification === null) continue;
		const group = tokens[classification.category];
		if (group === undefined) throw new Error(`unknown token category "${classification.category}"`);
		setPath(group, classification.shorthand.split('.'), { value: `var(${varName})` });
	}

	return tokens as unknown as PandaAliasTokens;
}

/** A mapped contract leaf's machine-readable mapping entry. */
export interface MappedTokenMapEntry {
	category: string;
	shorthand: string;
	token: string;
	reference: string;
}

/** A raw (non-token) contract leaf's machine-readable mapping entry. */
export interface RawTokenMapEntry {
	category: null;
	shorthand: null;
	token: null;
	reference: string;
}

/** The committed contract-path → mapping entry table, in tree order. */
export type TokenMapping = Record<string, MappedTokenMapEntry | RawTokenMapEntry>;

/**
 * Builds the machine-readable mapping keyed by contract path (in tree order). Mapped leaves carry
 * their category, shorthand, and `token()` expression; raw leaves carry nulls. `reference` is
 * always the leaf's `var(--luke-*)` string.
 */
export function buildTokenMapping(): TokenMapping {
	const mapping: TokenMapping = {};
	for (const [path, varName] of flattenThemeContract()) {
		const reference = `var(${varName})`;
		const classification = classifyLeaf(path.split('.'));
		if (classification === null) {
			mapping[path] = { category: null, shorthand: null, token: null, reference };
			continue;
		}
		mapping[path] = {
			category: classification.category,
			shorthand: classification.shorthand,
			token: `token('${classification.category}.${classification.shorthand}')`,
			reference,
		};
	}

	return mapping;
}
