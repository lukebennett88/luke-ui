import { globalLayer } from '@vanilla-extract/css';

/**
 * CSS cascade layers, ordered from lowest to highest priority.
 *
 * - **reset** — Normalize browser defaults (box-sizing, margins, form elements).
 * - **theme** — Design token custom properties and base typographic defaults.
 * - **base** — Application element defaults, below the component recipe layers.
 * - **components** — Retained component rules that are not StyleX: Prose descendant rhythm,
 *   LoadingSkeleton descendant masks, and Combobox adjacent-section selectors.
 * - **utilities** — One-off overrides; highest-priority layer for escape hatches.
 *
 * `globalLayer()` keeps Vanilla Extract's layer wiring consistent. The authoritative
 * combined order is prepended at build time before other CSS; redundant empty
 * `@layer name;` declarations are stripped so they cannot reorder already-created layers.
 */
export const layers = {
	reset: globalLayer('reset'),
	theme: globalLayer('theme'),
	base: globalLayer('base'),
	components: globalLayer('components'),
	utilities: globalLayer('utilities'),
} as const;

export type LayerName = keyof typeof layers;
