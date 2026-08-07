/**
 * Inheritance between theme-authoring inputs. `resolveThemeInput` folds an `extends` chain into one
 * plain {@link ThemeInput}, so the compiler consumes a merged input and stays ignorant of the chain.
 * It also records which colour roles the outermost theme inherited, so a contrast failure on a merged
 * input stays diagnosable.
 *
 * Inheritance happens at the granularity the compiler already resolves a value at. A child's values
 * behave exactly as if an author had written them on top of the base in one input.
 */

import type { ExtendingThemeInput, ThemeInput } from './define-theme.js';

/**
 * Where an extending theme's authored colours came from. `defineTheme` attaches it to a
 * {@link import('./build-theme.js').ThemeContrastError}, so a failing pair traces back to the theme
 * that supplied its source.
 */
export interface ThemeInheritance {
	/** Theme names, the extending theme first and the innermost base last. */
	chain: Array<string>;
	/** Colour roles the theme took from a base, for example `color.neutral`. */
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

/**
 * Resolves a theme input's `extends` chain into one merged {@link ThemeInput}, plus the colour
 * provenance of the outermost theme. Throws when a theme extends a theme that extends it.
 */
export function resolveThemeInput(input: ThemeInput | ExtendingThemeInput): ResolvedThemeInput {
	// A theme with no base returns the very object it was handed, which is what keeps a theme with no
	// base compiling exactly as it did.
	if (extendsNothing(input)) return { inheritance: null, input };
	const { base, inputs } = collectChain(input);
	// Fold from the innermost base outward, so each step merges one input over a complete
	// `ThemeInput` and `color.accent` is always present.
	let merged = base;
	// `inputs` runs outermost first and ends at `base`, which seeds the fold, so drop the last entry
	// and walk the rest backwards.
	for (const own of inputs.slice(0, -1).reverse()) {
		merged = inheritInput(merged, own);
	}
	return { inheritance: describeInheritance(input, inputs), input: merged };
}

interface ThemeChain {
	/** The innermost input, the one input in the chain that extends nothing. */
	base: ThemeInput;
	/** Every input in the chain, the outermost first and `base` last. */
	inputs: Array<ThemeInput | ExtendingThemeInput>;
}

/**
 * Reports whether an input ends a chain. Only {@link ExtendingThemeInput} makes `extends` required,
 * so an input without one authors its own `color.accent` and is a complete {@link ThemeInput}. The
 * two inputs share no literal-typed key, so TypeScript cannot narrow the union on its own and this
 * predicate states the relationship once.
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
			// The repeated name is the one that closes the cycle, which is not always the outermost theme.
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
		// The identity belongs to the theme the author declares, so `name` never comes from a base.
		name: own.name,
		radius: inheritKeys(base.radius, own.radius),
		typography: inheritTypography(base.typography, own.typography),
	};
}

/**
 * Merges source colours role by role. A role replaces the base's role whole, because
 * `resolveAdaptedRole` in `define-theme.ts` adapts a bare string per colour mode and uses an explicit
 * `{ light, dark }` side verbatim. A per-mode merge would turn a base's adapted string into two
 * verbatim values and change what the base meant, so the role is the smallest coherent unit.
 */
function inheritColor(
	base: ThemeInput['color'],
	own: Partial<ThemeInput['color']> | undefined,
): ThemeInput['color'] {
	if (own === undefined) return base;
	// `neutral` and `neutralStyle` are two spellings of one decision, and `resolveNeutral` prefers
	// `neutral`. A child that sets only `neutralStyle` and inherits a raw `neutral` loses its own
	// character, so a child that sets either key drops both inherited keys.
	const ownNeutral = own.neutral !== undefined || own.neutralStyle !== undefined;
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

/** A per-mode material section as the merge reads it: two optional modes of named string rungs. */
interface ModeLadders {
	dark?: Record<string, string | undefined>;
	light?: Record<string, string | undefined>;
}

/** Merges a per-mode material section, mode by mode and then rung by rung inside each mode. */
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
 * Merges two flat records key by key, an own value winning over a base value. A key the own record
 * sets to `undefined` inherits the base value, because composed authoring writes
 * `{ resting: condition ? value : undefined }` and an explicit `undefined` must read as an omitted
 * key. The returned record carries no key whose value is `undefined`.
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
 * Reports colour provenance from the collected chain. A role the outermost input sets is its own, a
 * role only an ancestor sets is inherited, and a role no input sets appears in neither list.
 */
function describeInheritance(
	outermost: ThemeInput | ExtendingThemeInput,
	inputs: Array<ThemeInput | ExtendingThemeInput>,
): ThemeInheritance {
	const inheritedColors: Array<string> = [];
	const ownColors: Array<string> = [];
	for (const role of COLOR_ROLES) {
		if (outermost.color?.[role] !== undefined) {
			ownColors.push(`color.${role}`);
			continue;
		}
		if (inputs.some((entry) => entry.color?.[role] !== undefined)) {
			inheritedColors.push(`color.${role}`);
		}
	}
	return { chain: inputs.map((entry) => entry.name), inheritedColors, ownColors };
}
