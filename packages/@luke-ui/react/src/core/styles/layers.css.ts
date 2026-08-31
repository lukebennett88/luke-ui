import { globalLayer } from '@vanilla-extract/css';

/**
 * CSS cascade layers, ordered from lowest to highest priority.
 *
 * - **reset** — Normalize browser defaults (box-sizing, margins, form elements).
 * - **theme** — Design token custom properties and base typographic defaults.
 * - **recipes** — Component styles (variants, compound variants).
 * - **structural** — Descendant rhythm, skeleton masking, and other retained global selectors.
 * - **utilities** — One-off overrides; highest-priority layer for escape hatches.
 *
 * `globalLayer()` keeps Vanilla Extract's layer wiring consistent. The authoritative
 * combined order is prepended at build time before other CSS; redundant empty
 * `@layer name;` declarations are stripped so they cannot reorder already-created layers.
 */
export const layers = {
	reset: globalLayer('reset'),
	theme: globalLayer('theme'),
	recipes: globalLayer('recipes'),
	structural: globalLayer('structural'),
	utilities: globalLayer('utilities'),
} as const;

export type LayerName = keyof typeof layers;
