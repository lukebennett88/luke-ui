/**
 * Inheritance between theme-authoring inputs. `resolveThemeInput` folds an `extends` chain into one
 * {@link ThemeInput}, and records which colours came from a base.
 *
 * A theme's values behave as if an author wrote them on top of the base in one input.
 */

import type { ExtendingThemeInput, ThemeInput } from './define-theme.js';

/** Which colours a theme authored, and which it inherited. Carried by `ThemeContrastError`. */
export interface ThemeInheritance {
	/** Theme names, the extending theme first and the innermost base last. */
	chain: Array<string>;
	/** Colour roles the theme took from a base, for example `color.accent`. */
	inheritedColors: Array<string>;
	/** Colour roles the theme authored itself. */
	ownColors: Array<string>;
}

/** A theme input with its `extends` chain already resolved. */
export interface ResolvedThemeInput {
	/** The merged input, with no `extends` left to resolve. */
	input: ThemeInput;
	/** The colour provenance, or `null` when the theme extends nothing. */
	inheritance: ThemeInheritance | null;
}

/** Colour roles in `ThemeInput['color']` declaration order, for a stable provenance report. */
const COLOR_ROLES = [
	'accent',
	'neutral',
	'neutralStyle',
	'background',
	'info',
	'success',
	'warning',
	'danger',
	'focus',
	'scrim',
] as const satisfies ReadonlyArray<keyof ThemeInput['color']>;

/** The two keys that spell one neutral decision. `inheritColor` inherits them together. */
const NEUTRAL_ROLES = ['neutral', 'neutralStyle'] as const satisfies ReadonlyArray<
	keyof ThemeInput['color']
>;

/** Whether a colour input authors the neutral character under either of its two keys. */
function authorsNeutral(color: Partial<ThemeInput['color']> | undefined): boolean {
	return NEUTRAL_ROLES.some((role) => color?.[role] !== undefined);
}

/**
 * Resolves a theme input's `extends` chain into one merged {@link ThemeInput}, plus the colour
 * provenance of the outermost theme. Throws when a theme extends a theme that extends it.
 */
export function resolveThemeInput(input: ThemeInput | ExtendingThemeInput): ResolvedThemeInput {
	// Returns the object it was handed, so inheritance cannot affect a theme with no base.
	if (extendsNothing(input)) return { inheritance: null, input };
	const { base, inputs } = collectChain(input);
	// Fold from the innermost base outward, so every step merges over a complete `ThemeInput` and
	// `color.accent` is always present.
	let merged = base;
	for (const own of inputs.slice(0, -1).reverse()) {
		merged = inheritInput(merged, own);
	}
	return {
		inheritance: describeInheritance(
			input,
			merged,
			inputs.map((entry) => entry.name),
		),
		input: merged,
	};
}

interface ThemeChain {
	/** The innermost input, the one input in the chain that extends nothing. */
	base: ThemeInput;
	/** Every input in the chain, the outermost first and `base` last. */
	inputs: Array<ThemeInput | ExtendingThemeInput>;
}

/**
 * Whether an input ends a chain. Only {@link ExtendingThemeInput} requires `extends`, so an input
 * without one is a complete {@link ThemeInput}. `extends` is not a discriminant, so the union needs
 * this predicate to narrow.
 */
function extendsNothing(input: ThemeInput | ExtendingThemeInput): input is ThemeInput {
	return input.extends === undefined;
}

/** Walks `extends` outermost first, and throws when the walk reaches an input twice. */
function collectChain(input: ThemeInput | ExtendingThemeInput): ThemeChain {
	const inputs: Array<ThemeInput | ExtendingThemeInput> = [];
	const seen = new Set<ThemeInput | ExtendingThemeInput>();
	let current: ThemeInput | ExtendingThemeInput = input;
	for (;;) {
		if (seen.has(current)) {
			const cycle = [...inputs, current].map((entry) => `"${entry.name}"`).join(' -> ');
			throw new Error(
				`Theme "${input.name}" has a cyclic extends chain: ${cycle}. ` +
					'A theme cannot extend a theme that extends it.',
			);
		}
		seen.add(current);
		inputs.push(current);
		if (extendsNothing(current)) return { base: current, inputs };
		current = current.extends;
	}
}

/** Merges one input over an already-merged base, section by section. */
function inheritInput(base: ThemeInput, own: ThemeInput | ExtendingThemeInput): ThemeInput {
	return {
		actionControlFinish: inheritModes(base.actionControlFinish, own.actionControlFinish),
		color: inheritColor(base.color, own.color),
		depth: inheritModes(base.depth, own.depth),
		// `name` never inherits: the identity belongs to the theme the author declares.
		name: own.name,
		radius: inheritKeys(base.radius, own.radius),
		typography: inheritTypography(base.typography, own.typography),
	};
}

/** Merges source colours role by role. A role replaces the base's role whole. */
function inheritColor(
	base: ThemeInput['color'],
	own: Partial<ThemeInput['color']> | undefined,
): ThemeInput['color'] {
	if (own === undefined) return base;
	// `neutral` and `neutralStyle` are two spellings of one decision, and `resolveNeutral` prefers
	// `neutral`. A theme that sets only `neutralStyle` must drop an inherited `neutral`, or the
	// inherited value would win.
	const ownNeutral = authorsNeutral(own);
	return {
		accent: own.accent ?? base.accent,
		background: own.background ?? base.background,
		danger: own.danger ?? base.danger,
		focus: own.focus ?? base.focus,
		info: own.info ?? base.info,
		neutral: ownNeutral ? own.neutral : base.neutral,
		neutralStyle: ownNeutral ? own.neutralStyle : base.neutralStyle,
		scrim: own.scrim ?? base.scrim,
		success: own.success ?? base.success,
		warning: own.warning ?? base.warning,
	};
}

/** A per-mode material section as the merge reads it: two optional modes of named rungs. */
interface ModeLadders {
	dark?: Record<string, string | undefined>;
	light?: Record<string, string | undefined>;
}

/** Merges a per-mode material section, mode by mode and then rung by rung. */
function inheritModes(
	base: ModeLadders | undefined,
	own: ModeLadders | undefined,
): ModeLadders | undefined {
	if (base === undefined) return own;
	if (own === undefined) return base;
	const merged: ModeLadders = {};
	const dark = inheritKeys(base.dark, own.dark);
	if (dark !== undefined) merged.dark = dark;
	const light = inheritKeys(base.light, own.light);
	if (light !== undefined) merged.light = light;
	return merged;
}

/** Merges typography. `fontFamily` is a scalar and replaces, and `fontWeight` merges key by key. */
function inheritTypography(
	base: ThemeInput['typography'],
	own: ThemeInput['typography'],
): ThemeInput['typography'] {
	if (base === undefined) return own;
	if (own === undefined) return base;
	const merged: NonNullable<ThemeInput['typography']> = {};
	const fontFamily = own.fontFamily ?? base.fontFamily;
	if (fontFamily !== undefined) merged.fontFamily = fontFamily;
	const fontWeight = inheritKeys(base.fontWeight, own.fontWeight);
	if (fontWeight !== undefined) merged.fontWeight = fontWeight;
	return merged;
}

/**
 * Merges two flat records key by key, an own value winning. A key set to `undefined` counts as
 * omitted and inherits, because composed authoring writes `{ resting: on ? value : undefined }`.
 */
function inheritKeys<Value>(
	base: Readonly<Record<string, Value | undefined>> | undefined,
	own: Readonly<Record<string, Value | undefined>> | undefined,
): Record<string, Value> | undefined {
	if (base === undefined && own === undefined) return undefined;
	const merged: Record<string, Value> = {};
	for (const key of new Set([...Object.keys(base ?? {}), ...Object.keys(own ?? {})])) {
		const value = own?.[key] ?? base?.[key];
		if (value !== undefined) merged[key] = value;
	}
	return merged;
}

/**
 * Reports which colours a theme authored and which it inherited. Reads the merged input, so a
 * colour a later theme discarded is reported as neither.
 */
function describeInheritance(
	outermost: ThemeInput | ExtendingThemeInput,
	merged: ThemeInput,
	chain: Array<string>,
): ThemeInheritance {
	const inheritedColors: Array<string> = [];
	const ownColors: Array<string> = [];
	for (const role of COLOR_ROLES) {
		if (outermost.color?.[role] !== undefined) ownColors.push(`color.${role}`);
		else if (merged.color[role] !== undefined) inheritedColors.push(`color.${role}`);
	}
	return { chain, inheritedColors, ownColors };
}
