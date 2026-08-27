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

export function globalStyleInLayer(
	layer: LayerName,
	selector: string,
	rule: LayeredGlobalStyleRule,
): void {
	vanillaGlobalStyle(selector, withLayerGlobal(layer, rule));
}

export function styleInLayer(layer: LayerName, rule: LayeredStyleRule, debugId?: string): string {
	return vanillaStyle(withLayer(layer, rule), debugId);
}
