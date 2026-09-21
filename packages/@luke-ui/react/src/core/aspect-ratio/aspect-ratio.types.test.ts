/**
 * Compile-time guards on the public AspectRatio prop contract.
 *
 * AspectRatio exposes the root layout slice of Box and nothing else: its ratio and objectFit unions
 * are closed, appearance utilities stay out, and the component owns its display mode.
 */

import { expect, test } from 'vite-plus/test';
import type { AspectRatioProps } from './aspect-ratio.js';

// @ts-expect-error — AspectRatio has a closed ratio union
const unsupportedRatio: AspectRatioProps = { ratio: '2 / 1' };
// @ts-expect-error — AspectRatio keeps objectFit to useful media values
const unsupportedObjectFit: AspectRatioProps = { objectFit: 'inherit' };
// @ts-expect-error — AspectRatio does not expose Box appearance utilities
const rejectedAppearance: AspectRatioProps = { backgroundColor: 'surface.resting' };
// @ts-expect-error — AspectRatio owns its display mode
const rejectedDisplay: AspectRatioProps = { display: 'flex' };

test('AspectRatio rejects the prop values it does not support', () => {
	expect([
		unsupportedRatio,
		unsupportedObjectFit,
		rejectedAppearance,
		rejectedDisplay,
	]).toHaveLength(4);
});
