import { expect, test } from 'vite-plus/test';
import type { AspectRatioProps } from './aspect-ratio.js';

// @ts-expect-error — AspectRatio has a closed ratio union
const unsupportedRatio: AspectRatioProps = { ratio: '2 / 1' };
// @ts-expect-error — objectFit is a closed union
const unsupportedObjectFit: AspectRatioProps = { objectFit: 'inherit' };
// @ts-expect-error — AspectRatio does not expose Box appearance utilities
const rejectedAppearance: AspectRatioProps = { backgroundColor: 'surface.resting' };
// @ts-expect-error — AspectRatio has no display prop
const rejectedDisplay: AspectRatioProps = { display: 'flex' };

test('AspectRatio rejects the prop values it does not support', () => {
	expect([
		unsupportedRatio,
		unsupportedObjectFit,
		rejectedAppearance,
		rejectedDisplay,
	]).toHaveLength(4);
});
