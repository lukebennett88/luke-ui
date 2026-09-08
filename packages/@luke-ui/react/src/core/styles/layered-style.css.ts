import type { GlobalStyleRule, StyleRule } from '@vanilla-extract/css';
import { globalStyle as vanillaGlobalStyle, style as vanillaStyle } from '@vanilla-extract/css';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { LayerName } from './layers.css.js';
import { layers } from './layers.css.js';

type LayeredStyleRule = DistributiveOmit<StyleRule, '@layer'>;
type LayeredGlobalStyleRule = DistributiveOmit<GlobalStyleRule, '@layer'>;

/** Layers Luke UI may write to. The `base` layer is reserved for the consuming application. */
type WritableLayerName = Exclude<LayerName, 'base'>;

function withLayer(layer: WritableLayerName, rule: LayeredStyleRule): StyleRule {
	return {
		'@layer': {
			[layers[layer]]: rule,
		},
	};
}

function withLayerGlobal(layer: WritableLayerName, rule: LayeredGlobalStyleRule): GlobalStyleRule {
	return {
		'@layer': {
			[layers[layer]]: rule,
		},
	};
}

/**
 * A private class in the `recipes` layer with no variants. Prefer `recipe()` for component visuals,
 * even when the recipe has no variants.
 */
export function style(rule: LayeredStyleRule, debugId?: string): string {
	return vanillaStyle(withLayer('recipes', rule), debugId);
}

/**
 * A global selector in a chosen layer. Use it for the reset, the theme root, and `structural`
 * rules.
 */
export function globalStyleInLayer(
	layer: WritableLayerName,
	selector: string,
	rule: LayeredGlobalStyleRule,
): void {
	vanillaGlobalStyle(selector, withLayerGlobal(layer, rule));
}
