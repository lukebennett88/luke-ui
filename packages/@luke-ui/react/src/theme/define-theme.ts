/**
 * The `defineTheme` authoring util: a small, curated-default authoring surface that normalises a
 * {@link ThemeInput} into the existing per-mode {@link ThemeFoundation} and hands it to
 * {@link buildTheme}. It is additive — `buildTheme` and its raw `ThemeFoundation` stay public — and
 * owns the single-value accent/neutral adaptation the raw foundation never had.
 */

import { buildTheme } from './build-theme.js';
import type { Oklch } from './color.js';
import { contrastRatio, formatOklch, gamutMapOklch, parseColor } from './color.js';
import type { ThemeFoundation, ThemeModeFoundation, ThemeSourceColors } from './foundation.js';
import { defaultSourceColors } from './foundation.js';

/**
 * A colour value: one string (adapted independently for each mode) OR a per-mode object where
 * EITHER side may be omitted to fall back to that role's curated default / generation. Strings
 * accept `#rgb`, `#rrggbb`, or `oklch(<l> <c> <h>)` (lightness 0-1 or %, no alpha), except `scrim`,
 * which is used verbatim and may carry an alpha channel.
 */
export type ColorInput = string | { light?: string; dark?: string };

/** A composite `box-shadow` ladder for one colour mode, rung by rung. */
export interface DepthLadder {
	/** Inset treatment for a pressed control or sunken surface. */
	recessed: string;
	/** Resting treatment for an interactive control or surface. */
	resting: string;
	/** Treatment for a hovered control or elevated surface. */
	raised: string;
	/** Treatment for a floating surface such as a menu. */
	floating: string;
	/** Treatment for a high-elevation surface such as a dialog. */
	overlay: string;
}

/** A Button/IconButton `background-image` face-finish ladder for one colour mode. */
export interface ControlFinish {
	/** Face lighting for a pressed control. */
	recessed: string;
	/** Face lighting for a resting control. */
	resting: string;
	/** Face lighting for a hovered control. */
	raised: string;
}

/**
 * The curated theme-authoring input. A basic theme authors an accent and a neutral character and
 * lets everything else default; materials are optional and deep-partial; light and dark stay
 * independently authorable.
 */
export interface ThemeInput {
	/**
	 * Kebab-case theme identity, for example `'tactile'`. The theme's identity class is
	 * `luke-ui-theme-${name}`.
	 */
	name: string;
	/** Source colours. Each is one value (adapted per mode) or an explicit `{ light, dark }` pair. */
	color: {
		/** Required — the brand or interaction accent. */
		accent: ColorInput;
		/** Neutral canvas anchor. Give a raw colour, or set `neutralStyle` for a curated neutral. */
		neutral?: ColorInput;
		/**
		 * Curated neutral character when `neutral` is omitted; sets the neutral hue and tint while the
		 * mode sets its lightness.
		 * @default 'neutral'
		 */
		neutralStyle?: 'cool' | 'neutral' | 'warm';
		/** Informational intent colour. Defaults to an accessible Luke UI blue for the mode. */
		info?: ColorInput;
		/** Success intent colour. Defaults to an accessible Luke UI green for the mode. */
		success?: ColorInput;
		/** Warning intent colour. Defaults to an accessible Luke UI amber for the mode. */
		warning?: ColorInput;
		/** Danger intent colour. Defaults to an accessible Luke UI red for the mode. */
		danger?: ColorInput;
		/** Keyboard-focus ring colour, used verbatim after gamut mapping. Defaults per mode. */
		focus?: ColorInput;
		/** Modal-backdrop dimming colour, used verbatim; defaults to black at a mode-aware alpha. */
		scrim?: ColorInput;
	};
	/** Typography — family and weights only. The type scale is source-owned (not authored here). */
	typography?: {
		/**
		 * Curated Capsize-compatible font-family choice.
		 * @default 'inter'
		 */
		fontFamily?: 'inter' | 'apple-system' | 'dm-sans';
		/** Font weights for the four theme-controlled weight roles. */
		fontWeight?: { body?: number; label?: number; heading?: number; emphasis?: number };
	};
	/** Corner radii. A generative base + multiplier scale, with explicit per-step overrides. */
	radius?: {
		/**
		 * Base radius in pixels. Generates `detail = base`, `control = base*2`, `surface = base*3`,
		 * `overlay = base*4`, each scaled by `multiplier`.
		 * @default 4
		 */
		base?: number;
		/**
		 * Scales the whole generated set.
		 * @default 1
		 */
		multiplier?: number;
		/** Explicit override for the detail radius (checkboxes, tags, badges). */
		detail?: number;
		/** Explicit override for the control radius (buttons, fields, selects). */
		control?: number;
		/** Explicit override for the surface radius (cards, popovers, menus). */
		surface?: number;
		/** Explicit override for the overlay radius (dialogs, sheets). */
		overlay?: number;
		// radius.full is fixed at 9999px and is not authored.
	};
	/**
	 * Composite `box-shadow` depth ladder, per mode. Optional and deep-partial: an omitted rung
	 * falls back to the curated extremely-subtle default for that mode.
	 */
	depth?: { light?: Partial<DepthLadder>; dark?: Partial<DepthLadder> };
	/**
	 * Button/IconButton face finish, per mode. Optional and deep-partial: an omitted rung falls back
	 * to `'none'` (a flat control).
	 */
	actionControlFinish?: { light?: Partial<ControlFinish>; dark?: Partial<ControlFinish> };
}

type ColorMode = 'light' | 'dark';

// The WCAG 2.2 AA text ratio the on-solid gate must clear; matches build-theme's TEXT_RATIO so the
// adaptation search and the build-time validation agree.
const TEXT_RATIO = 4.5;

/**
 * `neutralStyle` → the source neutral's hue and small chroma; the mode supplies the lightness.
 * Light `'cool'` ≈ `oklch(0.985 0.01 250)`; dark `'cool'` ≈ `oklch(0.22 0.01 250)`.
 */
const NEUTRAL_STYLE = {
	cool: { chroma: 0.01, hue: 250 },
	neutral: { chroma: 0, hue: 0 },
	warm: { chroma: 0.01, hue: 70 },
} as const satisfies Record<string, { chroma: number; hue: number }>;

// Canvas lightness a single-value or styled neutral targets per mode: near-white light, near-dark
// dark. The neutral solid's on-solid gate depends on its (tiny) chroma and a fixed solid lightness,
// not on this anchor, so the neutral never has the accent's mid-lightness dead zone.
const NEUTRAL_LIGHTNESS = { dark: 0.22, light: 0.985 } as const satisfies Record<ColorMode, number>;

// The vibrant band a single-value accent is adapted into, and the lightness the search starts from.
// Contrast for the on-solid text lives at the band edges (dark solids take near-white text, light
// solids take near-black); the middle is a dead zone, so the search targets a vibrant lightness and
// walks outward to the nearest lightness whose whole solid trio clears the gate.
const ACCENT_TARGET = { dark: 0.72, light: 0.5 } as const satisfies Record<ColorMode, number>;
const ACCENT_BAND = {
	dark: [0.6, 0.82],
	light: [0.4, 0.62],
} as const satisfies Record<ColorMode, [number, number]>;
const ACCENT_SEARCH_STEP = 0.0025;

/** Curated extremely-subtle, hue-neutral shadow ladder applied when a `depth` rung is omitted. */
export const defaultDepth: Record<ColorMode, DepthLadder> = {
	dark: {
		floating: '0 4px 12px oklch(0 0 0 / 0.45), 0 2px 4px oklch(0 0 0 / 0.3)',
		overlay: '0 12px 32px oklch(0 0 0 / 0.55), 0 4px 12px oklch(0 0 0 / 0.35)',
		raised: '0 2px 4px oklch(0 0 0 / 0.35), 0 1px 2px oklch(0 0 0 / 0.25)',
		recessed: 'inset 0 1px 2px oklch(0 0 0 / 0.3)',
		resting: '0 1px 2px oklch(0 0 0 / 0.3)',
	},
	light: {
		floating: '0 4px 12px oklch(0 0 0 / 0.08), 0 2px 4px oklch(0 0 0 / 0.05)',
		overlay: '0 12px 32px oklch(0 0 0 / 0.12), 0 4px 12px oklch(0 0 0 / 0.07)',
		raised: '0 2px 4px oklch(0 0 0 / 0.06), 0 1px 2px oklch(0 0 0 / 0.04)',
		recessed: 'inset 0 1px 2px oklch(0 0 0 / 0.06)',
		resting: '0 1px 2px oklch(0 0 0 / 0.05)',
	},
};

/** Curated flat control finish applied when an `actionControlFinish` rung is omitted. */
export const defaultControlFinish: ControlFinish = {
	raised: 'none',
	recessed: 'none',
	resting: 'none',
};

/** Curated modal-backdrop scrim applied when `scrim` is omitted, black at a mode-aware alpha. */
export const defaultScrim: Record<ColorMode, string> = {
	dark: 'oklch(0 0 0 / 0.4)',
	light: 'oklch(0 0 0 / 0.2)',
};

const DEFAULT_RADIUS_BASE = 4;
const DEFAULT_RADIUS_MULTIPLIER = 1;
const RADIUS_STEPS = { control: 2, detail: 1, overlay: 4, surface: 3 } as const;

/**
 * Compiles a curated {@link ThemeInput} into a complete static stylesheet. Normalises the input
 * into the per-mode {@link ThemeFoundation} shape — adapting single-value accents and neutrals per
 * mode, generating the radius scale, and merging materials over curated defaults — then delegates
 * to {@link buildTheme}, whose build-time contrast validation stays authoritative. Throws when a
 * single-value accent has no accessible lightness in a mode, and (via `buildTheme`) throws
 * {@link ThemeContrastError} when any resolved pair misses WCAG 2.2 AA.
 */
export function defineTheme(input: ThemeInput): string {
	const { foundation } = normalizeTheme(input);
	// The resolved `scrim` is computed by `normalizeTheme` but the emitted contract has no scrim
	// leaf yet, so there is nowhere to emit it in this additive slice. Emission lands in #228; until
	// then the resolved value is intentionally not consumed here.
	return buildTheme(foundation);
}

/** The fully resolved theme: the foundation `buildTheme` consumes plus the not-yet-emitted scrim. */
interface NormalizedTheme {
	foundation: ThemeFoundation;
	/** Resolved per-mode scrim. Computed but not emitted until the contract gains a scrim leaf (#228). */
	scrim: Record<ColorMode, string>;
}

/** Resolves a {@link ThemeInput} into the per-mode foundation and the resolved scrim. */
function normalizeTheme(input: ThemeInput): NormalizedTheme {
	const foundation: ThemeFoundation = {
		dark: buildModeFoundation(input, 'dark'),
		light: buildModeFoundation(input, 'light'),
		name: input.name,
		radius: resolveRadius(input),
	};
	if (input.typography !== undefined) foundation.typography = input.typography;
	return {
		foundation,
		scrim: {
			dark: resolveVerbatimRole(input.color.scrim, 'dark', defaultScrim.dark),
			light: resolveVerbatimRole(input.color.scrim, 'light', defaultScrim.light),
		},
	};
}

/** Resolves one mode's source colours and materials. */
function buildModeFoundation(input: ThemeInput, mode: ColorMode): ThemeModeFoundation {
	return {
		actionControlFinish: { ...defaultControlFinish, ...(input.actionControlFinish?.[mode] ?? {}) },
		color: resolveColors(input, mode),
		depth: { ...defaultDepth[mode], ...(input.depth?.[mode] ?? {}) },
	};
}

/** Resolves every source-colour role for one mode into the strings `buildTheme` accepts. */
function resolveColors(input: ThemeInput, mode: ColorMode): ThemeSourceColors {
	const { color } = input;
	const defaults = defaultSourceColors[mode];
	const colors: ThemeSourceColors = {
		accent: resolveAdaptedRole(color.accent, mode, adaptAccent),
		neutral: resolveNeutral(color, mode),
	};
	const feedback = {
		danger: color.danger,
		focus: color.focus,
		info: color.info,
		success: color.success,
		warning: color.warning,
	} as const;
	for (const role of ['info', 'success', 'warning', 'danger', 'focus'] as const) {
		colors[role] = resolveVerbatimRole(feedback[role], mode, defaults[role]);
	}
	return colors;
}

/**
 * Resolves an accent-style role that adapts a single value per mode. An explicit side is used
 * verbatim; a single string or an omitted side is adapted through `adapt` for the mode.
 */
function resolveAdaptedRole(
	input: ColorInput,
	mode: ColorMode,
	adapt: (source: Oklch, mode: ColorMode, raw: string) => Oklch,
): string {
	if (typeof input === 'string')
		return formatOklch(adapt(gamutMapOklch(parseColor(input)), mode, input));
	const side = sideOf(input, mode);
	if (side !== undefined) return side;
	// The other side is present (a partial `{ light }` or `{ dark }`); generate this side from it.
	const other = sideOf(input, mode === 'light' ? 'dark' : 'light');
	if (other === undefined) {
		throw new Error(`Theme "accent": provide a colour for at least one of light or dark.`);
	}
	return formatOklch(adapt(gamutMapOklch(parseColor(other)), mode, other));
}

/** Resolves the neutral role, honouring `neutral` then `neutralStyle` (default `'neutral'`). */
function resolveNeutral(color: ThemeInput['color'], mode: ColorMode): string {
	if (color.neutral !== undefined) {
		const side = sideOf(color.neutral, mode);
		if (side !== undefined) return side;
		if (typeof color.neutral === 'string') {
			return adaptNeutralString(gamutMapOklch(parseColor(color.neutral)), mode);
		}
		const other = sideOf(color.neutral, mode === 'light' ? 'dark' : 'light');
		if (other !== undefined) return adaptNeutralString(gamutMapOklch(parseColor(other)), mode);
	}
	const style = NEUTRAL_STYLE[color.neutralStyle ?? 'neutral'];
	return formatOklch(gamutMapOklch({ c: style.chroma, h: style.hue, l: NEUTRAL_LIGHTNESS[mode] }));
}

/** Adapts a single neutral source to the mode canvas lightness, preserving hue and chroma. */
function adaptNeutralString(source: Oklch, mode: ColorMode): string {
	return formatOklch(gamutMapOklch({ c: source.c, h: source.h, l: NEUTRAL_LIGHTNESS[mode] }));
}

/**
 * Resolves a feedback/focus role used verbatim. A single string is used for both modes; an explicit
 * side is used directly; an omitted side or role falls back to the curated mode default.
 */
function resolveVerbatimRole(
	input: ColorInput | undefined,
	mode: ColorMode,
	fallback: string,
): string {
	if (input === undefined) return fallback;
	if (typeof input === 'string') return input;
	return sideOf(input, mode) ?? fallback;
}

/** Returns the explicit side of a `ColorInput`, or `undefined` when it is a string or omitted. */
function sideOf(input: ColorInput, mode: ColorMode): string | undefined {
	return typeof input === 'string' ? undefined : input[mode];
}

/**
 * Adapts a single-value accent for one mode: preserve the source hue and chroma, then search the
 * vibrant band for a lightness whose whole solid trio (`solid`/`solidHover`/`solidPressed`) clears
 * the on-solid contrast gate. Returns the lightness nearest the mode target, and throws when no
 * lightness in the band is accessible.
 */
function adaptAccent(source: Oklch, mode: ColorMode, raw: string): Oklch {
	const target = ACCENT_TARGET[mode];
	const [low, high] = ACCENT_BAND[mode];
	const makeSolid = (l: number) => gamutMapOklch({ c: source.c, h: source.h, l });
	const passes = (l: number) => onSolidGatePasses(mode, makeSolid(l));

	if (passes(target)) return makeSolid(target);

	let best: number | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (let l = low; l <= high + 1e-9; l += ACCENT_SEARCH_STEP) {
		const candidate = clampUnit(l);
		if (!passes(candidate)) continue;
		const distance = Math.abs(candidate - target);
		if (distance < bestDistance) {
			bestDistance = distance;
			best = candidate;
		}
	}
	if (best === null) {
		throw new Error(
			`Theme accent "${raw}" has no accessible ${mode} lightness: no vibrant lightness lets ` +
				'near-white or near-black on-solid text clear 4.5:1 across the solid, hover, and pressed ' +
				'states. Author an explicit { light, dark } accent instead.',
		);
	}
	return makeSolid(best);
}

/**
 * Whether the on-solid gate passes for an accent solid: the near-white or near-black on-solid text
 * `buildTheme` would choose clears 4.5:1 against the solid, hover, and pressed states. Mirrors
 * `buildIntentKit` + `chooseOnSolid` in build-theme so the search agrees with build-time validation.
 */
function onSolidGatePasses(mode: ColorMode, solid: Oklch): boolean {
	const hoverDirection = mode === 'light' ? -1 : 1;
	const solids = [
		solid,
		gamutMapOklch({ ...solid, l: clampUnit(solid.l + 0.05 * hoverDirection) }),
		gamutMapOklch({ ...solid, l: clampUnit(solid.l + 0.09 * hoverDirection) }),
	];
	const nearWhite = gamutMapOklch({ c: 0, h: solid.h, l: 0.985 });
	const nearBlack = gamutMapOklch({ c: 0.01, h: solid.h, l: 0.18 });
	const whiteMinimum = Math.min(...solids.map((state) => contrastRatio(nearWhite, state)));
	const blackMinimum = Math.min(...solids.map((state) => contrastRatio(nearBlack, state)));
	return Math.max(whiteMinimum, blackMinimum) >= TEXT_RATIO;
}

/** Generates the radius scale from `base`/`multiplier`, with explicit per-step overrides winning. */
function resolveRadius(input: ThemeInput): NonNullable<ThemeFoundation['radius']> {
	const radius = input.radius;
	const base = radius?.base ?? DEFAULT_RADIUS_BASE;
	const multiplier = radius?.multiplier ?? DEFAULT_RADIUS_MULTIPLIER;
	const generated = (step: number) => Math.round(base * step * multiplier);
	return {
		control: radius?.control ?? generated(RADIUS_STEPS.control),
		detail: radius?.detail ?? generated(RADIUS_STEPS.detail),
		overlay: radius?.overlay ?? generated(RADIUS_STEPS.overlay),
		surface: radius?.surface ?? generated(RADIUS_STEPS.surface),
	};
}

function clampUnit(value: number): number {
	return Math.min(1, Math.max(0, value));
}
