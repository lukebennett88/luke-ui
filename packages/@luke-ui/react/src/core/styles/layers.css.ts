import { globalLayer } from '@vanilla-extract/css';
import { cascadeLayerNames } from './layer-names.js';

/**
 * CSS cascade layers, ordered from lowest to highest priority.
 *
 * - **reset** — Normalize browser defaults (box-sizing, margins, form elements).
 * - **theme** — Design token custom properties and base typographic defaults.
 * - **base** — Reserved for a consuming application's own element defaults or resets (e.g.
 *   Tailwind Preflight). Luke UI itself emits nothing into this layer; it declares the layer
 *   so a consumer's base-level styles rank correctly below component recipes instead of being
 *   created implicitly last (and therefore outranking everything) the first time the consumer
 *   writes to it.
 * - **recipes** — Component styles (variants, compound variants).
 * - **structural** — Descendant rhythm, skeleton masking, and other retained global selectors.
 * - **utilities** — One-off overrides; highest-priority layer for escape hatches.
 *
 * `globalLayer()` keeps Vanilla Extract's layer wiring consistent. The authoritative
 * combined order is prepended at build time before other CSS; redundant empty
 * `@layer name;` declarations are stripped so they cannot reorder already-created layers.
 *
 * Built by mapping `cascadeLayerNames` in order — that tuple, not this object, is the source of
 * truth for precedence, since `globalLayer()` call order is what establishes it.
 */
export const layers = Object.fromEntries(
	cascadeLayerNames.map((name) => [name, globalLayer(name)]),
) as { [Name in (typeof cascadeLayerNames)[number]]: ReturnType<typeof globalLayer> };

export type LayerName = keyof typeof layers;
