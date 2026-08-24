/**
 * The typed theme-foundation contract accepted by `buildTheme`, plus the curated defaults Luke UI
 * applies when optional foundation fields are omitted. Source colours that participate in generation
 * cross this boundary as {@link Oklch}; CSS-text values such as backdrop stay strings.
 */

import type { Oklch } from './color.js';

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
	/** Corner radii in pixels, shared by both modes. `radius.full` is fixed at 9999px. */
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
	/** Typography choices shared by both modes. */
	typography?: {
		/**
		 * Curated Capsize-compatible font-family choice. Applications load non-system font files
		 * themselves.
		 * @default 'inter'
		 */
		fontFamily?: 'inter' | 'apple-system' | 'dm-sans';
		/** Font weights for the four theme-controlled weight roles. */
		fontWeight?: {
			/**
			 * Weight for body text.
			 * @default 400
			 */
			body?: number;
			/**
			 * Weight for control labels and other dense UI text.
			 * @default 500
			 */
			label?: number;
			/**
			 * Weight for headings.
			 * @default 600
			 */
			heading?: number;
			/**
			 * Weight for emphasised inline text.
			 * @default 700
			 */
			emphasis?: number;
		};
	};
}

/** The per-mode authored inputs: source colours, action-control finish, and depth treatments. */
export interface ThemeModeFoundation {
	/** Final `background-image` values for the shared Button and IconButton face finish. */
	actionControlFinish: ActionControlFinishFoundation;
	/** Source colours the semantic colour contract is generated from. */
	color: ThemeSourceColors;
	/** Final composite `box-shadow` values for the semantic depth ladder. */
	depth: ThemeDepthFoundation;
}

/** Authored action-control face lighting for one colour mode. */
interface ActionControlFinishFoundation {
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
	 * Required. The canvas anchor, resolved per mode from an explicit `background`, an adapted
	 * opposite-mode `background`, or (when `background` is entirely omitted) a copy of the resolved
	 * `neutral` canvas anchor. `buildTheme` takes this value directly as the canvas anchor: every
	 * family's ramp and the elevation surfaces (including `color.surface.canvas`) are generated
	 * against `background`, not `neutral`.
	 */
	background: Oklch;
	/** Source colour for the `danger` role. */
	danger: Oklch;
	/** Keyboard-focus ring colour, used verbatim after gamut mapping. */
	focus: Oklch;
	/** Source colour for the `info` role. */
	info: Oklch;
	/**
	 * Required. Anchors the surface, text, and border ramps — the family's hue/chroma character.
	 * `background` is the actual canvas colour; the two coincide unless `background` is authored
	 * separately.
	 */
	neutral: Oklch;
	/**
	 * Modal-backdrop dimming colour, emitted verbatim (may carry an alpha channel). Required
	 * internally: `defineTheme` always resolves it, from the author's value or a mode-aware default.
	 */
	backdrop: string;
	/** Source colour for the `success` role. */
	success: Oklch;
	/** Source colour for the `warning` role. */
	warning: Oklch;
}

/**
 * The per-mode source colour fields that participate in generation as {@link Oklch}. `background` is
 * the resolved canvas anchor and `focus` is the authored keyboard-focus ring. `backdrop` is
 * deliberately absent, because it is emitted as CSS text rather than parsed.
 */
export const SOURCE_COLOR_FIELDS = [
	'neutral',
	'background',
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

/** Curated Capsize-compatible font stacks for each font-family choice. */
export const themeFontFamilyStacks = {
	'apple-system': "-apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', sans-serif",
	'dm-sans': "'DM Sans', system-ui, sans-serif",
	inter: "'Inter', system-ui, sans-serif",
} as const;

/** Fixed neutral font stack for code and keyboard input. */
export const codeFontFamilyStack =
	"ui-monospace, 'SFMono-Regular', 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

/** Default font-family choice applied when `typography.fontFamily` is omitted. */
export const defaultFontFamily = 'inter';

/** Default weights for the four weight roles. */
export const defaultFontWeights = { body: 400, emphasis: 700, heading: 600, label: 500 } as const;

/** Default corner radii in pixels. */
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
