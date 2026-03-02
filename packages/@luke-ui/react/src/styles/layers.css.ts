import { globalLayer } from '@vanilla-extract/css';

/**
 * CSS cascade layers, ordered from lowest to highest priority.
 *
 * - **reset** — Normalize browser defaults (box-sizing, margins, form elements).
 * - **theme** — Design token custom properties and base typographic defaults.
 * - **recipes** — Component styles (variants, compound variants).
 * - **utilities** — One-off overrides; highest-priority layer for escape hatches.
 */
export const layers = {
	reset: globalLayer('reset'),
	theme: globalLayer('theme'),
	recipes: globalLayer('recipes'),
	utilities: globalLayer('utilities'),
} as const;

export type LayerName = keyof typeof layers;
