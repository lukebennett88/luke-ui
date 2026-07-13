/**
 * The typed theme-foundation contract accepted by `buildTheme`, plus the curated defaults Luke UI
 * applies when optional foundation fields are omitted.
 */

/**
 * The complete input for one theme. A foundation is the minimal authored surface: Luke UI
 * generates the full semantic token contract from it.
 */
export interface ThemeFoundation {
	/**
	 * Kebab-case theme identity, for example `'machined-edge'`. The theme's identity class is
	 * `luke-ui-theme-${name}`.
	 */
	name: string;
	/** The light colour-mode foundation. */
	light: ThemeModeFoundation;
	/**
	 * The dark colour-mode foundation. Dark is authored independently and is never derived from
	 * light.
	 */
	dark: ThemeModeFoundation;
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
}

/** The per-mode authored inputs: source colours and final depth treatments. */
export interface ThemeModeFoundation {
	/** Source colours the semantic colour contract is generated from. */
	color: ThemeSourceColors;
	/** Final composite `box-shadow` values for the semantic depth ladder. */
	depth: ThemeDepthFoundation;
}

/**
 * Source colours for one mode. Values accept `#rgb`, `#rrggbb`, or `oklch(<l> <c> <h>)` with
 * lightness as a 0-1 number or a percentage, and no alpha channel.
 */
export interface ThemeSourceColors {
	/** Required. Anchors the surface, text, and border ramps; this is the canvas colour. */
	neutral: string;
	/** Required. The brand or interaction accent colour. */
	accent: string;
	/** Informational intent colour. Defaults to an accessible Luke UI blue for the mode. */
	info?: string;
	/** Success intent colour. Defaults to an accessible Luke UI green for the mode. */
	success?: string;
	/** Warning intent colour. Defaults to an accessible Luke UI amber for the mode. */
	warning?: string;
	/** Danger intent colour. Defaults to an accessible Luke UI red for the mode. */
	danger?: string;
	/**
	 * Keyboard-focus ring colour, used verbatim after gamut mapping. Defaults to an accessible
	 * Luke UI blue for the mode.
	 */
	focus?: string;
}

/** Authored composite `box-shadow` values for one colour mode. */
export interface ThemeDepthFoundation {
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

/** Curated Capsize-compatible font stacks for each font-family choice. */
export const themeFontFamilyStacks = {
	'apple-system': "-apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', sans-serif",
	'dm-sans': "'DM Sans', system-ui, sans-serif",
	inter: "'Inter', system-ui, sans-serif",
} as const;

/** Default font-family choice applied when `typography.fontFamily` is omitted. */
export const defaultFontFamily = 'inter';

/** Default weights for the four weight roles. */
export const defaultFontWeights = { body: 400, emphasis: 700, heading: 600, label: 500 } as const;

/** Default corner radii in pixels. */
export const defaultRadius = { control: 8, detail: 4, overlay: 16, surface: 12 } as const;

/**
 * Derives a concentric outer corner from an inner radius and the gap between the two edges.
 * Pass semantic variable references such as `vars.radius.control` and `vars.space[200]` so the
 * result follows the active theme.
 */
export function deriveConcentricRadius(innerRadius: string, gap: string): string {
	return `calc(${innerRadius} + ${gap})`;
}

/**
 * Mode-aware defaults for the optional source colours: info blue, success green, warning amber,
 * danger red, and focus blue, chosen to pass the build-time contrast gates on near-white and
 * near-black canvases.
 */
export const defaultSourceColors: Record<
	'light' | 'dark',
	Required<Pick<ThemeSourceColors, 'info' | 'success' | 'warning' | 'danger' | 'focus'>>
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
