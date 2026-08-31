/**
 * CSS cascade layers, ordered from lowest to highest priority.
 *
 * Plain string names are intentional: `globalLayer()` would emit empty `@layer name;`
 * declarations before the authoritative combined order statement prepended at build time.
 *
 * - **reset** — Normalize browser defaults (box-sizing, margins, form elements).
 * - **theme** — Design token custom properties and base typographic defaults.
 * - **recipes** — Component styles (variants, compound variants).
 * - **structural** — Descendant rhythm, skeleton masking, and other retained global selectors.
 * - **utilities** — One-off overrides; highest-priority layer for escape hatches.
 */
export const layers = {
	reset: 'reset',
	theme: 'theme',
	recipes: 'recipes',
	structural: 'structural',
	utilities: 'utilities',
} as const;

export type LayerName = keyof typeof layers;
