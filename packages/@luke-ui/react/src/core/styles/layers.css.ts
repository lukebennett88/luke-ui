import { globalLayer } from '@vanilla-extract/css';
import { cascadeLayerNames } from './layer-names.js';

/**
 * Cascade layers, ordered from lowest to highest priority.
 *
 * - **reset** — Browser defaults, root base colour, body typography, form defaults, focus, and
 *   reduced-motion defaults.
 * - **base** — Reserved for the consuming application (for example Tailwind Preflight). Declared
 *   empty so the first consumer write does not create the layer last and outrank `recipes`.
 * - **recipes** — All Luke UI component styling, including variants, compound styles, and
 *   component-owned descendant or combinator selectors.
 * - **utilities** — One-off overrides.
 *
 * Precedence comes from the order of `cascadeLayerNames`. The build prepends the combined `@layer`
 * order and strips empty `@layer name;` declarations that would reorder layers.
 */
export const layers = Object.fromEntries(
	cascadeLayerNames.map((name) => [name, globalLayer(name)]),
) as { [Name in (typeof cascadeLayerNames)[number]]: ReturnType<typeof globalLayer> };

export type LayerName = keyof typeof layers;
