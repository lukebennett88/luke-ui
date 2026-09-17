import { expectTypeOf, test } from 'vite-plus/test';
import type { ContainerProps } from './container.js';

test('Container accepts fixed values, CSS lengths, and root layout props', () => {
	const fixed: ContainerProps = { maxInlineSize: 'ct672' };
	const length: ContainerProps = { maxInlineSize: '42rem' };
	const padding: ContainerProps = { maxInlineSize: 'ct896', paddingInline: 'sp24' };
	const withRootLayout: ContainerProps = {
		flexGrow: '1',
		maxBlockSize: '100%',
		maxInlineSize: 'ct1280',
		overflow: 'hidden',
		position: 'relative',
	};
	expectTypeOf<typeof fixed>().toExtend<ContainerProps>();
	expectTypeOf<typeof length>().toExtend<ContainerProps>();
	expectTypeOf<typeof padding>().toExtend<ContainerProps>();
	expectTypeOf<typeof withRootLayout>().toExtend<ContainerProps>();

	// @ts-expect-error — Container requires a maximum inline size
	const missingMaximum: ContainerProps = {};
	// @ts-expect-error — Container fills its available inline size
	const rejectedInlineSize: ContainerProps = { inlineSize: '50%', maxInlineSize: 'ct672' };
	const rejectedAppearance: ContainerProps = {
		// @ts-expect-error — Container does not expose Box appearance utilities
		backgroundColor: 'surface.resting',
		maxInlineSize: 'ct672',
	};
	// @ts-expect-error — Container owns its child-layout algorithm
	const rejectedLayout: ContainerProps = { display: 'grid', maxInlineSize: 'ct672' };

	void missingMaximum;
	void rejectedInlineSize;
	void rejectedAppearance;
	void rejectedLayout;
});
