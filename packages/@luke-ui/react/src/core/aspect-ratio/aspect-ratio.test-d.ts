import { expectTypeOf, test } from 'vite-plus/test';
import type { AspectRatioProps } from './aspect-ratio.js';

test('AspectRatio accepts its supported ratios, objectFit values, and root layout props', () => {
	const defaultRatio: AspectRatioProps = {};
	const widescreen: AspectRatioProps = { ratio: '16 / 9' };
	const contain: AspectRatioProps = { objectFit: 'contain' };
	const withRootLayout: AspectRatioProps = {
		flexGrow: '1',
		inlineSize: { initial: '100%', bp768: '50%' },
		insetInlineStart: '0',
		maxInlineSize: '40rem',
		position: 'relative',
	};
	expectTypeOf<typeof defaultRatio>().toExtend<AspectRatioProps>();
	expectTypeOf<typeof widescreen>().toExtend<AspectRatioProps>();
	expectTypeOf<typeof contain>().toExtend<AspectRatioProps>();
	expectTypeOf<typeof withRootLayout>().toExtend<AspectRatioProps>();

	// @ts-expect-error — AspectRatio has a closed ratio union
	const unsupportedRatio: AspectRatioProps = { ratio: '2 / 1' };
	// @ts-expect-error — AspectRatio keeps objectFit to useful media values
	const unsupportedObjectFit: AspectRatioProps = { objectFit: 'inherit' };
	// @ts-expect-error — AspectRatio does not expose Box appearance utilities
	const rejectedAppearance: AspectRatioProps = { backgroundColor: 'surface.resting' };
	// @ts-expect-error — AspectRatio owns its display mode
	const rejectedDisplay: AspectRatioProps = { display: 'flex' };

	void unsupportedRatio;
	void unsupportedObjectFit;
	void rejectedAppearance;
	void rejectedDisplay;
});
