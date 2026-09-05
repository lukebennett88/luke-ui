import type { GlobalStyleRule } from '@vanilla-extract/css';
import { globalStyle as vanillaGlobalStyle } from '@vanilla-extract/css';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { LayerName } from './layers.css.js';
import { layers } from './layers.css.js';

type LayeredGlobalStyleRule = DistributiveOmit<GlobalStyleRule, '@layer'>;

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
