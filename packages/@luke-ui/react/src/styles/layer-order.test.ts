import { describe, expect, it } from 'vite-plus/test';
import { lukeLayerOrder } from './layer-order.js';
import { layers } from './layers.css.js';

/**
 * Equivalence guard for the deferred VE `theme` -> `base`/`tokens` rename.
 *
 * VE's shipped `layers.css.ts` still uses a single `theme` layer. This encodes
 * the settled decision that `theme` ≡ `{ base, tokens }` WITHOUT changing VE:
 * expanding VE's layer keys under that mapping must reproduce the canonical
 * order (minus `box`, which VE has no equivalent for yet).
 */
describe('layer-order equivalence with vanilla-extract', () => {
	it('expands VE layer keys into the canonical order (minus box)', () => {
		const veLayerKeys = Object.keys(layers); // ['reset', 'theme', 'recipes', 'utilities']
		const themeExpansion: Record<string, ReadonlyArray<string>> = {
			theme: ['base', 'tokens'],
		};
		const expanded = veLayerKeys.flatMap((key) => themeExpansion[key] ?? [key]);
		const canonicalWithoutBox = lukeLayerOrder.filter((name) => name !== 'box');

		expect(expanded).toEqual([...canonicalWithoutBox]);
	});
});
