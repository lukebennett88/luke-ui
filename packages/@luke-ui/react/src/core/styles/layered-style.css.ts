import type { GlobalStyleRule, StyleRule } from '@vanilla-extract/css';
import { globalStyle as vanillaGlobalStyle, style as vanillaStyle } from '@vanilla-extract/css';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { LayerName } from './layers.css.js';
import { layers } from './layers.css.js';

type LayeredStyleRule = DistributiveOmit<StyleRule, '@layer'>;
type LayeredGlobalStyleRule = DistributiveOmit<GlobalStyleRule, '@layer'>;

/**
 * Layers Luke UI is allowed to write to. `base` is reserved for the consuming application's own
 * element defaults, so the authoring helpers do not accept it. The contract test proves the built
 * stylesheet honours that reservation.
 */
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
 * A standalone private component class in the `recipes` layer.
 *
 * Use it for a class a component applies directly and that has no variant selection: simple
 * wrappers such as `Em`, marker or scope classes, and other implementation classes. A component's
 * visual treatment with recipe semantics belongs in `recipe()` instead, even with zero variants.
 */
export function style(rule: LayeredStyleRule, debugId?: string): string {
	return vanillaStyle(withLayer('recipes', rule), debugId);
}

/**
 * A global selector rule in an explicit layer.
 *
 * Use it where the layer choice is meaningful: the reset and theme root, and `structural`
 * descendant or combinator rules such as Prose rhythm and LoadingSkeleton masks.
 */
export function globalStyleInLayer(
	layer: WritableLayerName,
	selector: string,
	rule: LayeredGlobalStyleRule,
): void {
	vanillaGlobalStyle(selector, withLayerGlobal(layer, rule));
}
