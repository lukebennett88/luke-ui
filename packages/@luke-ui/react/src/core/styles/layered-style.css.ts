import type { GlobalStyleRule, StyleRule } from '@vanilla-extract/css';
import { globalStyle as vanillaGlobalStyle, style as vanillaStyle } from '@vanilla-extract/css';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { LayerName } from './layers.css.js';
import { layers } from './layers.css.js';

type LayeredStyleRule = DistributiveOmit<StyleRule, '@layer'>;
type LayeredGlobalStyleRule = DistributiveOmit<GlobalStyleRule, '@layer'>;

function withLayer(layer: LayerName, rule: LayeredStyleRule): StyleRule {
	return {
		'@layer': {
			[layers[layer]]: rule,
		},
	};
}

function withLayerGlobal(layer: LayerName, rule: LayeredGlobalStyleRule): GlobalStyleRule {
	return {
		'@layer': {
			[layers[layer]]: rule,
		},
	};
}

/**
 * A private class in the `luke-ui.recipes` layer with no variants. Prefer `recipe()` for component visuals,
 * even when the recipe has no variants.
 */
export function style(rule: LayeredStyleRule, debugId?: string): string {
	return vanillaStyle(withLayer('recipes', rule), debugId);
}

/**
 * A global selector in a chosen Luke UI layer. Use it for the global stylesheet and for
 * component-owned descendant or combinator selectors that still belong in `recipes`.
 */
export function globalStyleInLayer(
	layer: LayerName,
	selector: string,
	rule: LayeredGlobalStyleRule,
): void {
	vanillaGlobalStyle(selector, withLayerGlobal(layer, rule));
}
