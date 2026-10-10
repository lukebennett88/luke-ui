import { assertType, describe, expect, it } from 'vite-plus/test';
import { cascadeLayers } from './layer-names.js';
import type { globalStyleInLayer } from './layered-style.css.js';
import { layers } from './layers.css.js';

// A value import would cross Vanilla Extract's serialization boundary.
type WritableLayer = Parameters<typeof globalStyleInLayer>[0];

describe('layers', () => {
	// `recipe()` reads the plain names, and `style()` and the utilities read the Vanilla Extract ones.
	it('gives Vanilla Extract the same layer names the recipe engine uses', () => {
		expect(layers).toEqual(cascadeLayers);
	});

	it('keeps the base layer out of the layers Luke UI may write to', () => {
		assertType<WritableLayer>('recipes');
		// @ts-expect-error — Luke UI must not write to the consumer-owned base layer
		assertType<WritableLayer>('base');
	});
});
