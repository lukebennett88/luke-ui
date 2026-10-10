/**
 * The typed theme-foundation contract accepted by `buildTheme`, plus the curated defaults Luke UI
 * applies when optional foundation fields are omitted. Source colours that participate in generation
 * cross this boundary as {@link Oklch}; CSS-text values such as backdrop stay strings.
 */

import type { Oklch } from './color.js';
import type { ThemeFont, ThemeFontWeights } from './font.js';

/**
 * The complete input for one theme. A foundation is the minimal authored surface: Luke UI
 * generates the full semantic token contract from it.
 */
export interface ThemeFoundation {
	/**
	 * The dark colour-mode foundation. Dark is authored independently and is never derived from
	 * light.
	 */
	dark: ThemeModeFoundation;
	/** The light colour-mode foundation. */
	light: ThemeModeFoundation;
	/**
	 * Kebab-case theme identity, for example `'tactile'`. The theme's identity class is
	 * `luke-ui-theme-${name}`.
	 */
	name: string;
	/** Corner radii shared by both modes. Emitted as `rem`. `radius.full` is fixed at 9999px. */
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
	/** Fonts and weights shared by both modes. */
	typography: {
		/** The body font, and the display font when the theme has one. */
		fonts: { body: ThemeFont; display?: ThemeFont };
		fontWeight?: ThemeFontWeights;
	};
}

/** The per-mode authored inputs: source colours, control finish, and depth treatments. */
export interface ThemeModeFoundation {
	/** Source colours the semantic colour contract is generated from. */
	color: ThemeSourceColors;
	/** Final `background-image` values for the face of a solid control fill. */
	controlFinish: ControlFinishFoundation;
	/** Final composite `box-shadow` values for the semantic depth ladder. */
	depth: ThemeDepthFoundation;
}

/** Authored control face lighting for one colour mode. */
interface ControlFinishFoundation {
	/** Face lighting for a hovered control. */
	raised: string;
	/** Face lighting for a pressed control. */
	recessed: string;
	/** Face lighting for a resting control. */
	resting: string;
}

/**
 * Source colours for one mode, already resolved into {@link Oklch} for every role that participates
 * in generation. `defineTheme` applies curated defaults and parses authoring strings once;
 * `buildTheme` consumes these values as colours, not CSS text. `backdrop` is the exception: it is
 * emitted verbatim and may carry an alpha channel.
 */
export interface ThemeSourceColors {
	/** Required. The brand or interaction accent colour. */
	accent: Oklch;
	/**
	 * Modal-backdrop dimming colour, emitted verbatim (may carry an alpha channel). Required
	 * internally: `defineTheme` always resolves it, from the author's value or a mode-aware default.
	 */
	backdrop: string;
	/** Source colour for the `danger` role. */
	danger: Oklch;
	/** Keyboard-focus ring colour, used verbatim after gamut mapping. */
	focus: Oklch;
	/** Source colour for the `info` role. */
	info: Oklch;
	/**
	 * Required. Anchors the surface, text, and border ramps — the family's hue/chroma character.
	 * `surface.base` is the actual base colour; the two coincide unless `surface.base` is authored
	 * separately.
	 */
	neutral: Oklch;
	/** Source colour for the `success` role. */
	success: Oklch;
	/** The resolved base surface plus any surface the author set explicitly for this mode. */
	surface: ThemeSurfaceSources;
	/** Source colour for the `warning` role. */
	warning: Oklch;
}

/** The surface roles a theme emits. */
export const SURFACE_ROLES = ['base', 'subdued', 'field', 'overlay'] as const;

/** A surface role. */
export type SurfaceRole = (typeof SURFACE_ROLES)[number];

/**
 * One mode's surface sources. `base` is always resolved. Other roles are present only when authored;
 * `buildTheme` generates the rest from `base`.
 */
export type ThemeSurfaceSources = { base: Oklch } & Partial<Record<SurfaceRole, Oklch>>;

/**
 * The per-mode source colour fields that participate in generation as {@link Oklch}, apart from the
 * surfaces. `focus` is the authored keyboard-focus ring. `backdrop` is deliberately absent, because
 * it is emitted as CSS text rather than parsed.
 */
export const SOURCE_COLOR_FIELDS = [
	'neutral',
	'accent',
	'info',
	'success',
	'warning',
	'danger',
	'focus',
] as const;

/** Authored composite `box-shadow` values for one colour mode. */
interface ThemeDepthFoundation {
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

/** Fixed neutral font stack for code and keyboard input. */
export const codeFontFamilyStack =
	"ui-monospace, 'SFMono-Regular', 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

/** Default weights for the four weight roles. */
export const defaultFontWeights = { body: 400, emphasis: 700, heading: 600, label: 500 } as const;

/** Default corner radii. Emitted as `rem`. */
export const defaultRadius = { control: 8, detail: 4, overlay: 16, surface: 12 } as const;

/**
 * Derives a concentric outer corner from an inner radius and the gap between the two edges.
 * Pass variable references such as `vars.radius.control` and `vars.space.sp8` so the result follows
 * the active theme.
 */
export function deriveConcentricRadius<InnerRadius extends string, Gap extends string>(
	innerRadius: InnerRadius,
	gap: Gap,
) {
	return `calc(${innerRadius} + ${gap})` as const;
}

/**
 * Derives a concentric inner corner from an outer radius and the gap between the two edges,
 * clamped at zero so a large gap never produces a negative radius. Pass variable references such as
 * `vars.radius.surface` and `vars.space.sp12` so the result follows the active theme.
 */
export function deriveNestedRadius<OuterRadius extends string, Gap extends string>(
	outerRadius: OuterRadius,
	gap: Gap,
) {
	return `max(0px, calc(${outerRadius} - ${gap}))` as const;
}

/**
 * Mode-aware defaults for the optional source colours: info blue, success green, warning amber,
 * danger red, and focus blue, chosen to pass the build-time contrast gates on near-white and
 * near-black canvases.
 */
export const defaultSourceColors: Record<
	'light' | 'dark',
	Record<'info' | 'success' | 'warning' | 'danger' | 'focus', string>
> = {
	dark: {
		danger: 'oklch(0.72 0.16 25)',
		focus: 'oklch(0.72 0.13 255)',
		info: 'oklch(0.72 0.13 255)',
		success: 'oklch(0.74 0.13 150)',
		warning: 'oklch(0.78 0.13 80)',
	},
	light: {
		danger: 'oklch(0.52 0.18 27)',
		focus: 'oklch(0.55 0.17 255)',
		info: 'oklch(0.52 0.16 255)',
		success: 'oklch(0.5 0.13 150)',
		warning: 'oklch(0.72 0.14 75)',
	},
};
