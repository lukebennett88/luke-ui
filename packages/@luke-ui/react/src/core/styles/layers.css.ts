import { globalLayer } from '@vanilla-extract/css';

/**
 * CSS cascade layers, ordered from lowest to highest priority.
 *
 * - **reset** — Normalize browser defaults (box-sizing, margins, form elements).
 * - **theme** — Design token custom properties and base typographic defaults.
 * - **base** — Application element defaults, below the component recipe layers.
 * - **recipes** — Component styles. StyleX itself creates numbered `recipes.priorityN`
 *   sublayers here; retained rules that are not StyleX (Prose descendant rhythm, LoadingSkeleton
 *   forced surface and descendant masks, Combobox adjacent-section selectors) are written
 *   DIRECTLY into this layer via `globalStyleInLayer('recipes', ...)`, not into a sublayer. A
 *   direct parent-layer rule beats a nested sublayer for normal declarations, which is what lets
 *   this retained CSS reliably override StyleX recipe output; the relationship reverses for
 *   `!important` declarations, so retained rules in this layer must never use `!important` — see
 *   `stylesheet-contract.test.ts`'s guard against `!important` in `recipes.priorityN`.
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
	recipes: globalLayer('recipes'),
	utilities: globalLayer('utilities'),
} as const;

export type LayerName = keyof typeof layers;
