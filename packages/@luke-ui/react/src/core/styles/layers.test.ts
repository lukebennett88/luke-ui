import { assertType, describe, expect, it } from 'vite-plus/test';
import type { globalStyleInLayer } from './layered-style.css.js';
import { layers } from './layers.css.js';

/**
 * The `layered-style` import above is type-only: it is a function-exporting `.css.ts` module, so a
 * value import would turn this file into a failing Vanilla Extract serialization boundary.
 */
type WritableLayer = Parameters<typeof globalStyleInLayer>[0];

// The `base` layer is declared for the consuming application (Tailwind Preflight and the like) and
// Luke UI must never write into it. That reservation is documented for consumers, and nothing about
// it is structural — widen the parameter back to `LayerName` and the package would still compile.
// @ts-expect-error — base is reserved for the consuming application
const reservedBaseLayer: WritableLayer = 'base';

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
		expect(reservedBaseLayer).toBe('base');
	});
});
