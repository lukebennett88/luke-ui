import { expectTypeOf, test } from 'vite-plus/test';
import type { StackProps } from './stack.js';

test('Stack accepts an omitted gap and the zero spacing key', () => {
	const withoutGap: StackProps = {};
	const withGap: StackProps = { gap: 'sp16' };
	const withZeroGap: StackProps = { gap: '0' };
	const withResponsiveGap: StackProps = { gap: { initial: 'sp8', bp768: 'sp16' } };
	const withRootLayout: StackProps = {
		flexGrow: '1',
		inlineSize: { initial: '100%', bp768: '50%' },
		insetInlineStart: '0',
		paddingInline: 'sp16',
		position: 'relative',
	};
	expectTypeOf<typeof withoutGap>().toExtend<StackProps>();
	expectTypeOf<typeof withGap>().toExtend<StackProps>();
	expectTypeOf<typeof withZeroGap>().toExtend<StackProps>();
	expectTypeOf<typeof withResponsiveGap>().toExtend<StackProps>();
	expectTypeOf<typeof withRootLayout>().toExtend<StackProps>();

	// @ts-expect-error — responsive gaps require an initial value
	const responsiveGapWithoutInitial: StackProps = { gap: { bp768: 'sp16' } };
	// @ts-expect-error — Stack does not expose Box appearance utilities
	const rejectedAppearance: StackProps = { backgroundColor: 'surface.resting' };
	// @ts-expect-error — Stack owns its child-layout algorithm
	const rejectedLayout: StackProps = { display: 'grid' };

	void withoutGap;
	void withGap;
	void withZeroGap;
	void responsiveGapWithoutInitial;
	void rejectedAppearance;
	void rejectedLayout;
});
