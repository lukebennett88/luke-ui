import { assertType, test } from 'vite-plus/test';
import type { AspectRatioProps } from './aspect-ratio.js';

test('AspectRatio rejects the prop values it does not support', () => {
	// @ts-expect-error — AspectRatio has a closed ratio union
	assertType<AspectRatioProps>({ ratio: '2 / 1' });
	// @ts-expect-error — objectFit is a closed union
	assertType<AspectRatioProps>({ objectFit: 'inherit' });
	// @ts-expect-error — AspectRatio does not expose Box appearance utilities
	assertType<AspectRatioProps>({ backgroundColor: 'surface.canvas' });
	// @ts-expect-error — AspectRatio has no display prop
	assertType<AspectRatioProps>({ display: 'flex' });
});
