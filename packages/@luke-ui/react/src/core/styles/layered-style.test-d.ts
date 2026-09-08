/** Type-level assertions against the layers the style authoring helpers accept. */

import { assertType, test } from 'vite-plus/test';
import type { globalStyleInLayer } from './layered-style.css.js';

/**
 * The import above is type-only: `layered-style` is a function-exporting `.css.ts` module, so a
 * value import would turn it into a failing Vanilla Extract serialization boundary.
 */
test('globalStyleInLayer rejects the reserved base layer', () => {
	assertType<Parameters<typeof globalStyleInLayer>[0]>('structural');
	// @ts-expect-error — base is reserved for the consuming application
	assertType<Parameters<typeof globalStyleInLayer>[0]>('base');
});
