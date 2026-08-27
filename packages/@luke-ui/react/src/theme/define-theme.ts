/**
 * The `defineTheme` authoring util: the sole public theme-authoring surface. It normalises a small,
 * curated-default {@link ThemeInput} into the internal per-mode {@link ThemeFoundation} and hands it
 * to the internal {@link buildTheme} value pipeline. It owns the single-value accent/neutral
 * adaptation and the one resolution of curated defaults (source colours, materials, radius,
 * backdrop) into {@link Oklch} values the foundation carries.
 */

import { typedEntries, typedFromEntries } from '../shared/utils/utils.js';
import { buildTheme, ThemeContrastError } from './build-theme.js';
import type { Oklch } from './color.js';
import { gamutMapOklch, parseColor } from './color.js';
import { TEXT_RATIO } from './contrast-policy.js';
import { resolveThemeInput } from './extend-theme.js';
import type { ThemeFoundation, ThemeModeFoundation, ThemeSourceColors } from './foundation.js';
import { defaultSourceColors } from './foundation.js';
import { lightnessCandidates } from './lightness-candidates.js';
import { highContrastText, passesOnSolidGate } from './scale.js';

/**
 * A colour value: one string (adapted independently for each mode) OR a per-mode object where
 * EITHER side may be omitted to fall back to that role's curated default / generation. Strings
 * accept `#rgb`, `#rrggbb`, or `oklch(<l> <c> <h>)` (lightness 0-1 or %, no alpha), except
 * `backdrop`, which is used verbatim and may carry an alpha channel.
 */
export type ColorInput = string | { light?: string; dark?: string };

/** A composite `box-shadow` ladder for one colour mode, rung by rung. */
export interface DepthLadder {
	/** Treatment for a floating surface such as a menu. */
	floating: string;
	/** Treatment for a high-elevation surface such as a dialog. */
	overlay: string;
	/** Treatment for a hovered control or elevated surface. */
	raised: string;
	/** Inset treatment for a pressed control or sunken surface. */
	recessed: string;
	/** Resting treatment for an interactive control or surface. */
	resting: string;
}

/** A Button/IconButton `background-image` face-finish ladder for one colour mode. */
export interface ControlFinish {
	/** Face lighting for a hovered control. */
	raised: string;
	/** Face lighting for a pressed control. */
	recessed: string;
	/** Face lighting for a resting control. */
	resting: string;
}

/**
 * The theme identity plus the optional sections a theme inherits key by key. Shared by a theme that
 * authors its own accent and one that extends another theme.
 */
interface ThemeInputCommon {
	/**
	 * Button/IconButton face finish, per mode. Optional and deep-partial: an omitted rung falls back
	 * to `'none'` (a flat control).
	 */
	actionControlFinish?: { light?: Partial<ControlFinish>; dark?: Partial<ControlFinish> };
	/**
	 * Composite `box-shadow` depth ladder, per mode. Optional and deep-partial: an omitted rung
	 * falls back to the curated extremely-subtle default for that mode.
	 */
	depth?: { light?: Partial<DepthLadder>; dark?: Partial<DepthLadder> };
	/**
	 * Kebab-case theme identity, for example `'tactile'`. The theme's identity class is
	 * `luke-ui-theme-${name}`.
	 */
	name: string;
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
	/** Typography — family and weights only. The typography styles are source-owned (not authored here). */
	typography?: {
		/**
		 * Curated Capsize-compatible font-family choice.
		 * @default 'inter'
		 */
		fontFamily?: 'inter' | 'apple-system' | 'dm-sans';
		/** Font weights for the four theme-controlled weight roles. */
		fontWeight?: { body?: number; label?: number; heading?: number; emphasis?: number };
	};
}

/**
 * The curated theme-authoring input for a theme that authors its own accent. A basic theme authors
 * an accent and a neutral character and lets everything else default. Materials are optional and
 * deep-partial, and light and dark stay independently authorable. A theme that starts from another
 * theme instead uses {@link ExtendingThemeInput}.
 */
export interface ThemeInput extends ThemeInputCommon {
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
		/**
		 * The canvas anchor, split from `neutral`'s hue/chroma character. Give a raw colour to move the
		 * canvas away from the resolved neutral while keeping the neutral family's own character.
		 * Defaults to the resolved neutral canvas anchor.
		 */
		background?: ColorInput;
		/** Source colour for the `info` role. Defaults to an accessible Luke UI blue for the mode. */
		info?: ColorInput;
		/** Source colour for the `success` role. Defaults to an accessible Luke UI green for the mode. */
		success?: ColorInput;
		/** Source colour for the `warning` role. Defaults to an accessible Luke UI amber for the mode. */
		warning?: ColorInput;
		/** Source colour for the `danger` role. Defaults to an accessible Luke UI red for the mode. */
		danger?: ColorInput;
		/** Keyboard-focus ring colour, used verbatim after gamut mapping. Defaults per mode. */
		focus?: ColorInput;
		/** Modal-backdrop dimming colour, used verbatim; defaults to black at a mode-aware alpha. */
		backdrop?: ColorInput;
	};
	/**
	 * A theme to start from. Every value this theme leaves out comes from the base. `name` never
	 * inherits, so an extending theme always declares its own identity.
	 */
	extends?: ThemeInput | ExtendingThemeInput;
}

/**
 * A theme that starts from another theme. It declares its own `name` and overrides any part of the
 * base.
 */
export interface ExtendingThemeInput extends ThemeInputCommon {
	/** Source-colour overrides. Every role the theme leaves out comes from the base. */
	color?: Partial<ThemeInput['color']>;
	/** The theme to start from. */
	extends: ThemeInput | ExtendingThemeInput;
}

type ColorMode = 'light' | 'dark';

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
// walks outward to the nearest lightness whose solid rest, hover, and pressed clear the on-solid
// gate. The band is deliberately wider than the generator's own tone-faithful window, which is what
// lets it rescue accents the generator alone could not reach.
const ACCENT_TARGET = { dark: 0.72, light: 0.5 } as const satisfies Record<ColorMode, number>;
const ACCENT_BAND = {
	dark: [0.6, 0.82],
	light: [0.4, 0.62],
} as const satisfies Record<ColorMode, [number, number]>;

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

/** Curated modal-backdrop colour applied when `backdrop` is omitted, black at a mode-aware alpha. */
export const defaultBackdrop: Record<ColorMode, string> = {
	dark: 'oklch(0 0 0 / 0.4)',
	light: 'oklch(0 0 0 / 0.2)',
};

const DEFAULT_RADIUS_BASE = 4;
const DEFAULT_RADIUS_MULTIPLIER = 1;
const RADIUS_STEPS = { control: 2, detail: 1, overlay: 4, surface: 3 } as const;

/**
 * Compiles a curated {@link ThemeInput} into a complete static stylesheet. Resolves any `extends`
 * chain into one merged input first, then normalises it into the per-mode {@link ThemeFoundation}
 * shape — adapting single-value accents and neutrals per mode, resolving source colours to
 * {@link Oklch} once, generating the radius scale, and merging materials over curated defaults —
 * then delegates to {@link buildTheme}, whose build-time contrast validation stays authoritative.
 * Throws when a single-value accent has no accessible lightness in a mode, and (via `buildTheme`)
 * throws {@link ThemeContrastError} when any resolved pair misses WCAG 2.2 AA.
 */
export function defineTheme(input: ThemeInput | ExtendingThemeInput): string {
	const resolved = resolveThemeInput(input);
	try {
		return buildTheme(normalizeTheme(resolved.input));
	} catch (error) {
		if (error instanceof ThemeContrastError && resolved.inheritance !== null) {
			throw new ThemeContrastError(error.failures, resolved.inheritance);
		}
		throw error;
	}
}

/**
 * Resolves a merged {@link ThemeInput} into the internal per-mode {@link ThemeFoundation}
 * `buildTheme` consumes. The `extends` chain must already be folded; call {@link resolveThemeInput}
 * once and pass `resolved.input`. Exported for internal callers and tests only; it is not part of
 * the public package entry, where `defineTheme` is the sole authoring surface.
 */
export function normalizeTheme(input: ThemeInput): ThemeFoundation {
	const foundation: ThemeFoundation = {
		dark: buildModeFoundation(input, 'dark'),
		light: buildModeFoundation(input, 'light'),
		name: input.name,
		radius: resolveRadius(input),
	};
	if (input.typography !== undefined) foundation.typography = input.typography;
	return foundation;
}

/** Resolves one mode's source colours and materials. */
function buildModeFoundation(input: ThemeInput, mode: ColorMode): ThemeModeFoundation {
	return {
		actionControlFinish: {
			...defaultControlFinish,
			...omitUndefined(input.actionControlFinish?.[mode] ?? {}),
		},
		color: resolveColors(input, mode),
		depth: { ...defaultDepth[mode], ...omitUndefined(input.depth?.[mode] ?? {}) },
	};
}

/**
 * Drops keys whose value is explicitly `undefined`. Composed authoring naturally produces objects
 * like `{ resting: someCondition ? value : undefined }`, and an object spread keeps an
 * explicitly-`undefined` key, which would otherwise overwrite (rather than fall back to) the curated
 * default it is merged over.
 */
function omitUndefined<T extends Record<string, unknown>>(record: T): Partial<T> {
	return typedFromEntries<Partial<T>>(
		typedEntries(record).filter(([, value]) => value !== undefined),
	);
}

/** Resolves every source-colour role for one mode into the {@link Oklch} values `buildTheme` accepts. */
function resolveColors(input: ThemeInput, mode: ColorMode): ThemeSourceColors {
	const { color } = input;
	const defaults = defaultSourceColors[mode];
	const neutral = resolveNeutral(color, mode);
	const textPrimary = highContrastText(neutral, mode);
	const colors: ThemeSourceColors = {
		accent: resolveAdaptedRole(color.accent, mode, (source, mode, raw) => {
			return adaptAccent(source, mode, raw, textPrimary);
		}),
		// The canvas anchor, split from `neutral`'s hue/chroma character: explicit per-mode value wins,
		// a single value or the opposite side is adapted to the mode canvas lightness, and an entirely
		// omitted `background` copies the resolved neutral canvas anchor exactly (not a second,
		// independent adaptation of the neutral source). `buildModeColors` takes this resolved value
		// directly as the canvas anchor for every family's ramp and the elevation surfaces.
		background: resolveOptionalModeColour(color.background, mode, neutral),
		neutral,
		// Emitted verbatim; a single string applies to both modes, an omitted side falls back to the
		// curated mode-aware default.
		backdrop: resolveVerbatimRole(color.backdrop, mode, defaultBackdrop[mode]),
		danger: resolveSourceRole(color.danger, mode, defaults.danger),
		focus: resolveSourceRole(color.focus, mode, defaults.focus),
		info: resolveSourceRole(color.info, mode, defaults.info),
		success: resolveSourceRole(color.success, mode, defaults.success),
		warning: resolveSourceRole(color.warning, mode, defaults.warning),
	};
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
): Oklch {
	if (typeof input === 'string') return adapt(gamutMapOklch(parseColor(input)), mode, input);
	const side = sideOf(input, mode);
	if (side !== undefined) return gamutMapOklch(parseColor(side));
	// The other side is present (a partial `{ light }` or `{ dark }`); generate this side from it.
	const other = sideOf(input, mode === 'light' ? 'dark' : 'light');
	if (other === undefined) {
		throw new Error(`Theme "accent": provide a colour for at least one of light or dark.`);
	}
	return adapt(gamutMapOklch(parseColor(other)), mode, other);
}

/** Resolves the neutral role, honouring `neutral` then `neutralStyle` (default `'neutral'`). */
function resolveNeutral(color: ThemeInput['color'], mode: ColorMode): Oklch {
	if (color.neutral !== undefined) {
		const side = sideOf(color.neutral, mode);
		if (side !== undefined) return gamutMapOklch(parseColor(side));
		if (typeof color.neutral === 'string') {
			return adaptNeutral(gamutMapOklch(parseColor(color.neutral)), mode);
		}
		const other = sideOf(color.neutral, mode === 'light' ? 'dark' : 'light');
		if (other !== undefined) return adaptNeutral(gamutMapOklch(parseColor(other)), mode);
	}
	const style = NEUTRAL_STYLE[color.neutralStyle ?? 'neutral'];
	return gamutMapOklch({
		l: NEUTRAL_LIGHTNESS[mode],
		c: style.chroma,
		h: style.hue,
	});
}

/** Adapts a single neutral source to the mode canvas lightness, preserving hue and chroma. */
function adaptNeutral(source: Oklch, mode: ColorMode): Oklch {
	return gamutMapOklch({
		l: NEUTRAL_LIGHTNESS[mode],
		c: source.c,
		h: source.h,
	});
}

/**
 * Resolves an optional canvas-anchor role (currently `background`) for one mode: an explicit side
 * wins, a single string or the opposite side is adapted to the mode canvas lightness (mirroring
 * `adaptNeutral`), and an entirely omitted input falls back to `fallback` verbatim — the
 * resolved neutral canvas anchor, not a second independent adaptation.
 */
function resolveOptionalModeColour(
	input: ColorInput | undefined,
	mode: ColorMode,
	fallback: Oklch,
): Oklch {
	if (input === undefined) return fallback;
	const side = sideOf(input, mode);
	if (side !== undefined) return gamutMapOklch(parseColor(side));
	if (typeof input === 'string') {
		return adaptNeutral(gamutMapOklch(parseColor(input)), mode);
	}
	const other = sideOf(input, mode === 'light' ? 'dark' : 'light');
	if (other !== undefined) return adaptNeutral(gamutMapOklch(parseColor(other)), mode);
	return fallback;
}

/**
 * Resolves a feedback/focus role used as a generator colour. A single string is used for both modes;
 * an explicit side is used directly; an omitted side or role falls back to the curated mode default.
 */
function resolveSourceRole(
	input: ColorInput | undefined,
	mode: ColorMode,
	fallback: string,
): Oklch {
	if (input === undefined) return gamutMapOklch(parseColor(fallback));
	if (typeof input === 'string') return gamutMapOklch(parseColor(input));
	return gamutMapOklch(parseColor(sideOf(input, mode) ?? fallback));
}

/**
 * Resolves a role used verbatim as CSS text. A single string is used for both modes; an explicit
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
 * Adapts a single-value accent for one mode: preserve hue and chroma, then search the vibrant band
 * for a lightness that clears {@link passesOnSolidGate} against the same `text.primary` production
 * generation uses. Returns the lightness nearest the mode target. Throws when none in the band is
 * accessible. The band is wider than the generator's tone-faithful window, which is what lets it
 * rescue accents that window cannot reach.
 */
function adaptAccent(source: Oklch, mode: ColorMode, raw: string, interactionSource: Oklch): Oklch {
	const target = ACCENT_TARGET[mode];
	const [low, high] = ACCENT_BAND[mode];
	const makeSolid = (l: number) => {
		return gamutMapOklch({
			l,
			c: source.c,
			h: source.h,
		});
	};
	const passes = (l: number) => {
		return passesOnSolidGate({ interactionSource, lightness: l, source });
	};

	if (passes(target)) return makeSolid(target);

	let best: number | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (const candidate of lightnessCandidates(low, high)) {
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
				`near-white or near-black on-solid text clear ${TEXT_RATIO}:1 across the solid and its ` +
				'generated hover and pressed states. Author an explicit { light, dark } accent instead.',
		);
	}
	return makeSolid(best);
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
