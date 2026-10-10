import { assertType, describe, expect, it } from 'vite-plus/test';
import { cascadeLayerOrder } from './layer-names.js';
import type { globalStyleInLayer } from './layered-style.css.js';
import { layers } from './layers.css.js';

// A value import would cross Vanilla Extract's serialization boundary.
type WritableLayer = Parameters<typeof globalStyleInLayer>[0];

describe('layers', () => {
	it('nests Luke UI layers inside luke-ui, from lowest to highest priority', () => {
		expect(layers).toEqual({
			reset: 'luke-ui.reset',
			recipes: 'luke-ui.recipes',
			utilities: 'luke-ui.utilities',
		});
	});

	it('orders the consumer base layer before luke-ui, then the sublayers', () => {
		expect(cascadeLayerOrder).toBe(
			'@layer base, luke-ui;\n@layer luke-ui {\n  @layer reset, recipes, utilities;\n}',
		);
	});

	it('keeps the base layer out of the layers Luke UI may write to', () => {
		assertType<WritableLayer>('recipes');
		// @ts-expect-error — Luke UI must not write to the consumer-owned base layer
		assertType<WritableLayer>('base');
	});
});
