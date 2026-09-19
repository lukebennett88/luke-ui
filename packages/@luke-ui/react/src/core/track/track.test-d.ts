import { expectTypeOf, test } from 'vite-plus/test';
import type { TrackRecipeVariants } from './recipe.css.js';
import type { TrackProps } from './track.js';

test('Track accepts an omitted gap and the zero spacing key', () => {
	const withoutGap: TrackProps = {};
	const withGap: TrackProps = { gap: 'sp16' };
	const withZeroGap: TrackProps = { gap: '0' };
	const withResponsiveGap: TrackProps = { gap: { initial: 'sp8', bp768: 'sp16' } };
	const withTrackProps: TrackProps = {
		elementType: 'li',
		railAlignment: 'firstLine',
		railEnd: 'End rail',
		railStart: 'Start rail',
	};
	const recipeVariants: TrackRecipeVariants = {
		isInline: true,
		railAlignment: 'end',
	};
	expectTypeOf<typeof withoutGap>().toExtend<TrackProps>();
	expectTypeOf<typeof withGap>().toExtend<TrackProps>();
	expectTypeOf<typeof withZeroGap>().toExtend<TrackProps>();
	expectTypeOf<typeof withResponsiveGap>().toExtend<TrackProps>();
	expectTypeOf<typeof withTrackProps>().toExtend<TrackProps>();
	expectTypeOf<typeof recipeVariants>().toExtend<TrackRecipeVariants>();
	expectTypeOf<TrackProps['elementType']>().toEqualTypeOf<'div' | 'li' | 'span' | undefined>();
	expectTypeOf<TrackProps['railAlignment']>().toEqualTypeOf<
		NonNullable<TrackRecipeVariants>['railAlignment']
	>();

	// @ts-expect-error — responsive gaps require an initial value
	const responsiveGapWithoutInitial: TrackProps = { gap: { bp768: 'sp16' } };
	// @ts-expect-error — spacing keys are strings
	const numericZeroGap: TrackProps = { gap: 0 };
	// @ts-expect-error — Track supports only its three documented root elements
	const unsupportedElement: TrackProps = { elementType: 'section' };
	// @ts-expect-error — Track owns its rail-alignment vocabulary
	const unsupportedAlignment: TrackProps = { railAlignment: 'baseline' };

	void withoutGap;
	void withGap;
	void withZeroGap;
	void withResponsiveGap;
	void withTrackProps;
	void recipeVariants;
	void responsiveGapWithoutInitial;
	void numericZeroGap;
	void unsupportedElement;
	void unsupportedAlignment;
});
