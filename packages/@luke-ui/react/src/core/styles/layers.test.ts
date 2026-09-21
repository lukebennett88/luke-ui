import { assertType, describe, expect, it } from 'vite-plus/test';
import type { globalStyleInLayer } from './layered-style.css.js';
import { layers } from './layers.css.js';

// A value import would cross Vanilla Extract's serialization boundary.
type WritableLayer = Parameters<typeof globalStyleInLayer>[0];

describe('layers', () => {
	it('declares cascade layers from lowest to highest priority', () => {
		expect(Object.keys(layers)).toEqual([
			'reset',
			'theme',
			'base',
			'recipes',
			'structural',
			'utilities',
		]);
	});

	it('keeps the base layer out of the layers Luke UI may write to', () => {
		assertType<WritableLayer>('structural');
		// @ts-expect-error — Luke UI must not write to the consumer-owned base layer
		assertType<WritableLayer>('base');
	});
});
