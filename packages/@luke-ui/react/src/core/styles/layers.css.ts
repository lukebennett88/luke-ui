import { globalLayer } from '@vanilla-extract/css';

/** CSS cascade layers. The build prepends the combined order before other CSS. */
export const layers = {
	reset: globalLayer('reset'),
	theme: globalLayer('theme'),
	base: globalLayer('base'),
	recipes: globalLayer('recipes'),
	utilities: globalLayer('utilities'),
} as const;

export type LayerName = keyof typeof layers;
