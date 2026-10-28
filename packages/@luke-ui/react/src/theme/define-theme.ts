/**
 * The `defineTheme` authoring util: the sole public theme-authoring surface. It normalises a small,
 * curated-default {@link ThemeInput} into the internal per-mode {@link ThemeFoundation} and hands it
 * to the internal {@link buildTheme} value pipeline. It owns the single-value accent/neutral
 * adaptation and the one resolution of curated defaults (source colours, surfaces, materials,
 * backdrop) into {@link Oklch} values the foundation carries.
 */

import { typedEntries, typedFromEntries } from '../shared/utils/utils.js';
import { buildTheme } from './build-theme.js';
import type { Oklch } from './color.js';
import { gamutMapOklch, parseColor } from './color.js';
import { TEXT_RATIO } from './contrast-policy.js';
import type { ThemeFont, ThemeFontWeights } from './font.js';
import type {
	ThemeFoundation,
	ThemeModeFoundation,
	ThemeSourceColors,
	ThemeSurfaceSources,
} from './foundation.js';
import { defaultSourceColors } from './foundation.js';
import { lightnessCandidates } from './lightness-candidates.js';
import { highContrastText, passesOnSolidGate } from './scale.js';
import { ThemeValidationError, validateThemeInput } from './validate-input.js';

/**
 * A colour: one string, or a per-mode object where either side may be omitted. Each role documents
 * how it uses one string and what a missing side becomes. Strings accept `#rgb`, `#rrggbb`, or
 * `oklch(<l> <c> <h>)` (lightness 0-1 or %, no alpha), except `backdrop`, which may carry alpha.
 */
type ColorInput = string | ModeColorInput;

/** A colour for each mode. Either side may be omitted. */
type ModeColorInput = { light?: string; dark?: string };

type NeutralInput =
	| string
	| (ModeColorInput & { style?: never })
	| { style: 'neutral' | 'warm' | 'cool'; light?: never; dark?: never };

/** A composite `box-shadow` ladder for one colour mode, rung by rung. */
export interface ShadowLadder {
	/** Treatment for a floating surface such as a menu. */
	floating: string;
	/** Treatment for a high-elevation surface such as a dialog. */
	overlay: string;
	/** Treatment for a hovered control or elevated surface. */
	raised: string;
	/** Inset treatment for a pressed control or sunken surface. */
	inset: string;
	/** Resting treatment for an interactive control or surface. */
	resting: string;
}

/** A `background-image` face-finish ladder for solid control fills, for one colour mode. */
interface ControlFinish {
	/** Face lighting for a hovered control. */
	raised: string;
	/** Face lighting for a pressed control. */
	recessed: string;
	/** Face lighting for a resting control. */
	resting: string;
}

/**
 * The theme identity and optional sections.
 */
interface ThemeInputCommon {
	/**
	 * Face finish for solid control fills, such as a solid Button or a checked Checkbox, per mode.
	 * Optional and deep-partial: an omitted rung falls back to `'none'` (a flat control).
	 */
	controlFinish?: { light?: Partial<ControlFinish>; dark?: Partial<ControlFinish> };
	/**
	 * Composite `box-shadow` ladder, per mode. Optional and deep-partial: an omitted rung
	 * falls back to the curated extremely-subtle default for that mode.
	 */
	shadow?: { light?: Partial<ShadowLadder>; dark?: Partial<ShadowLadder> };
	/**
	 * Kebab-case theme identity, for example `'tactile'`. The theme's identity class is
	 * `luke-ui-theme-${name}`.
	 */
	name: string;
	/** Corner radii in pixels, emitted as `rem`. `radius.full` is fixed at 9999px. */
	radius?: {
		/**
		 * Radius for checkbox boxes, tags, badges, and compact details.
		 * @default 4
		 */
		detail?: number;
		/**
		 * Radius for buttons, fields, selects, and other controls.
		 * @default 8
		 */
		control?: number;
		/**
		 * Radius for cards, popovers, and menus.
		 * @default 12
		 */
		surface?: number;
		/**
		 * Radius for dialogs, sheets, and large overlays.
		 * @default 16
		 */
		overlay?: number;
	};
}

/**
 * The curated theme-authoring input. A basic theme authors an accent and a body font and lets
 * everything else default. Materials are optional and deep-partial, with independent modes.
 */
export interface ThemeInput extends ThemeInputCommon {
	/** Source colours. Each is one string or a `{ light, dark }` object. */
	color: {
		/**
		 * Required — the brand or interaction accent. One string, or a missing side, is adapted to the
		 * mode: its hue and chroma are kept and its lightness is chosen for accessible on-solid text.
		 */
		accent: ColorInput;
		/**
		 * Neutral character as a colour or curated style. A single colour or missing side is
		 * adapted to the mode's base lightness. Defaults to `{ style: 'neutral' }`.
		 */
		neutral?: NeutralInput;
		/**
		 * The three surfaces. Each is optional. Set one when its generated default does not suit the
		 * theme or fails a contrast gate. An authored surface is mapped into the sRGB gamut, but its
		 * lightness is never changed to pass contrast.
		 */
		surface?: {
			/**
			 * The default page and control background. Role colours are generated from it. One string,
			 * or a missing side, is adapted to each mode like `neutral`. Defaults to the neutral.
			 */
			base?: ColorInput;
			/** Secondary regions, such as a sidebar. A missing side is a fixed offset from `base`. */
			subdued?: ModeColorInput;
			/** Elevated panels, cards, menus, popovers, and dialogs. A missing side is a fixed offset from `base`. */
			raised?: ModeColorInput;
		};
		/**
		 * Source colour for the `info` role. One string is used in both modes. A missing side uses an
		 * accessible Luke UI blue for that mode.
		 */
		info?: ColorInput;
		/**
		 * Source colour for the `success` role. One string is used in both modes. A missing side uses an
		 * accessible Luke UI green for that mode.
		 */
		success?: ColorInput;
		/**
		 * Source colour for the `warning` role. One string is used in both modes. A missing side uses an
		 * accessible Luke UI amber for that mode.
		 */
		warning?: ColorInput;
		/**
		 * Source colour for the `danger` role. One string is used in both modes. A missing side uses an
		 * accessible Luke UI red for that mode.
		 */
		danger?: ColorInput;
		/** Keyboard-focus ring colour. One string is used in both modes. Defaults per mode. */
		focus?: ColorInput;
		/** Modal-backdrop dimming colour, used verbatim; defaults to black at a mode-aware alpha. */
		backdrop?: ColorInput;
	};
	/** Fonts and weights. Luke UI owns type sizes, line heights, and letter spacing. */
	typography: {
		fonts: {
			/** Font for `caption`, `label`, `body`, and `lead` text. */
			body: ThemeFont;
			/** CSS font-family stack for code. Defaults to the system monospace stack. */
			code?: string;
			/**
			 * Font for `heading4` through `heading1` and `display` text. Omitted or `null`, those styles
			 * use the body font.
			 */
			display?: ThemeFont | null;
		};
		/** Weights for the four weight roles. */
		fontWeight?: ThemeFontWeights;
	};
}

type ColorMode = 'light' | 'dark';

/**
 * `neutral.style` → the source neutral's hue and small chroma; the mode supplies the lightness.
 * Light `'cool'` ≈ `oklch(0.985 0.01 250)`; dark `'cool'` ≈ `oklch(0.22 0.01 250)`.
 */
const NEUTRAL_STYLE = {
	cool: { chroma: 0.01, hue: 250 },
	neutral: { chroma: 0, hue: 0 },
	warm: { chroma: 0.01, hue: 70 },
} as const satisfies Record<string, { chroma: number; hue: number }>;

// Base lightness a single-value or styled neutral targets per mode: near-white light, near-dark
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

/** Curated extremely-subtle, hue-neutral shadow ladder applied when a `shadow` rung is omitted. */
export const defaultShadow: Record<ColorMode, ShadowLadder> = {
	dark: {
		floating: '0 4px 12px oklch(0 0 0 / 0.45), 0 2px 4px oklch(0 0 0 / 0.3)',
		overlay: '0 12px 32px oklch(0 0 0 / 0.55), 0 4px 12px oklch(0 0 0 / 0.35)',
		raised: '0 2px 4px oklch(0 0 0 / 0.35), 0 1px 2px oklch(0 0 0 / 0.25)',
		inset: 'inset 0 1px 2px oklch(0 0 0 / 0.3)',
		resting: '0 1px 2px oklch(0 0 0 / 0.3)',
	},
	light: {
		floating: '0 4px 12px oklch(0 0 0 / 0.08), 0 2px 4px oklch(0 0 0 / 0.05)',
		overlay: '0 12px 32px oklch(0 0 0 / 0.12), 0 4px 12px oklch(0 0 0 / 0.07)',
		raised: '0 2px 4px oklch(0 0 0 / 0.06), 0 1px 2px oklch(0 0 0 / 0.04)',
		inset: 'inset 0 1px 2px oklch(0 0 0 / 0.06)',
		resting: '0 1px 2px oklch(0 0 0 / 0.05)',
	},
};

/** Curated flat control finish applied when a `controlFinish` rung is omitted. */
const defaultControlFinish: ControlFinish = {
	raised: 'none',
	recessed: 'none',
	resting: 'none',
};

/** Curated modal-backdrop colour applied when `backdrop` is omitted, black at a mode-aware alpha. */
export const defaultBackdrop: Record<ColorMode, string> = {
	dark: 'oklch(0 0 0 / 0.4)',
	light: 'oklch(0 0 0 / 0.2)',
};

/** Compiles a standalone theme into static CSS, validating its fields and contrast. */
export function defineTheme(input: ThemeInput): string {
	const issues = validateThemeInput(input);
	if (issues.length > 0) throw new ThemeValidationError(issues);
	return buildTheme(normalizeTheme(input));
}

/** Resolves an authored input into the internal per-mode foundation. */
export function normalizeTheme(input: ThemeInput): ThemeFoundation {
	const { display, body, code } = input.typography.fonts;
	const foundation: ThemeFoundation = {
		dark: buildModeFoundation(input, 'dark'),
		light: buildModeFoundation(input, 'light'),
		name: input.name,
		typography: {
			fonts: { body, ...(display ? { display } : {}), ...(code !== undefined ? { code } : {}) },
		},
	};
	if (input.typography.fontWeight !== undefined) {
		foundation.typography.fontWeight = input.typography.fontWeight;
	}
	if (input.radius !== undefined) foundation.radius = input.radius;
	return foundation;
}

/** Resolves one mode's source colours and materials. */
function buildModeFoundation(input: ThemeInput, mode: ColorMode): ThemeModeFoundation {
	return {
		color: resolveColors(input, mode),
		controlFinish: {
			...defaultControlFinish,
			...omitUndefined(input.controlFinish?.[mode] ?? {}),
		},
		shadow: { ...defaultShadow[mode], ...omitUndefined(input.shadow?.[mode] ?? {}) },
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
		accent: resolveAdaptedRole(color.accent, mode, (source, accentMode, raw) => {
			return adaptAccent(source, accentMode, raw, textPrimary);
		}),
		neutral,
		// Emitted verbatim; a single string applies to both modes, an omitted side falls back to the
		// curated mode-aware default.
		backdrop: resolveVerbatimRole(color.backdrop, mode, defaultBackdrop[mode]),
		danger: resolveSourceRole(color.danger, mode, defaults.danger),
		focus: resolveSourceRole(color.focus, mode, defaults.focus),
		info: resolveSourceRole(color.info, mode, defaults.info),
		success: resolveSourceRole(color.success, mode, defaults.success),
		surface: resolveSurfaces(color.surface, mode, neutral),
		warning: resolveSourceRole(color.warning, mode, defaults.warning),
	};
	return colors;
}

/** Resolves `base` and any surface authored for this mode. `buildTheme` generates the rest. */
function resolveSurfaces(
	surface: ThemeInput['color']['surface'],
	mode: ColorMode,
	neutral: Oklch,
): ThemeSurfaceSources {
	const resolved: ThemeSurfaceSources = {
		base: resolveOptionalModeColour(surface?.base, mode, neutral),
	};
	for (const role of ['subdued', 'raised'] as const) {
		const side = surface?.[role]?.[mode];
		if (side !== undefined) resolved[role] = gamutMapOklch(parseColor(side));
	}
	return resolved;
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

/** Resolves the neutral role from a colour or curated style. */
function resolveNeutral(color: ThemeInput['color'], mode: ColorMode): Oklch {
	if (
		color.neutral !== undefined &&
		(typeof color.neutral === 'string' || color.neutral.style === undefined)
	) {
		const side = sideOf(color.neutral, mode);
		if (side !== undefined) return gamutMapOklch(parseColor(side));
		if (typeof color.neutral === 'string') {
			return adaptNeutral(gamutMapOklch(parseColor(color.neutral)), mode);
		}
		const other = sideOf(color.neutral, mode === 'light' ? 'dark' : 'light');
		if (other !== undefined) return adaptNeutral(gamutMapOklch(parseColor(other)), mode);
	}
	const style =
		NEUTRAL_STYLE[
			typeof color.neutral === 'object' ? (color.neutral.style ?? 'neutral') : 'neutral'
		];
	return gamutMapOklch({
		l: NEUTRAL_LIGHTNESS[mode],
		c: style.chroma,
		h: style.hue,
	});
}

/** Adapts a single neutral source to the mode base lightness, preserving hue and chroma. */
function adaptNeutral(source: Oklch, mode: ColorMode): Oklch {
	return gamutMapOklch({
		l: NEUTRAL_LIGHTNESS[mode],
		c: source.c,
		h: source.h,
	});
}

/**
 * Resolves `surface.base` for one mode like the neutral: an explicit side wins, one string or the
 * other side is adapted, and an omitted input is `fallback`, the resolved neutral.
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
	function makeSolid(l: number) {
		return gamutMapOklch({
			l,
			c: source.c,
			h: source.h,
		});
	}
	function passes(l: number) {
		return passesOnSolidGate({ interactionSource, lightness: l, source });
	}

	if (passes(target)) return makeSolid(target);

	const best: number | null = (() => {
		let bestInner: number | null = null;
		let bestDistance = Number.POSITIVE_INFINITY;

		for (const candidate of lightnessCandidates(low, high)) {
			if (!passes(candidate)) continue;

			const distance = Math.abs(candidate - target);
			if (distance < bestDistance) {
				bestDistance = distance;
				bestInner = candidate;
			}
		}

		return bestInner;
	})();
	if (best === null) {
		throw new Error(
			`Theme accent "${raw}" has no accessible ${mode} lightness: no vibrant lightness lets ` +
				`near-white or near-black on-solid text clear ${TEXT_RATIO}:1 across the solid and its ` +
				'generated hover and pressed states. Author an explicit { light, dark } accent instead.',
		);
	}
	return makeSolid(best);
}
