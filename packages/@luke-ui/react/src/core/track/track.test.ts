import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { TrackRecipeVariants } from './recipe.css.js';
import type { TrackProps } from './track.js';

test('Track keeps its root element and rail alignment closed unions', () => {
	expectTypeOf<TrackProps['elementType']>().toEqualTypeOf<'div' | 'li' | 'span' | undefined>();
	expectTypeOf<TrackProps['railAlignment']>().toEqualTypeOf<
		NonNullable<TrackRecipeVariants>['railAlignment']
	>();
});

test('Track rejects the prop values it does not support', () => {
	// @ts-expect-error — responsive gaps require an initial value
	assertType<TrackProps>({ gap: { bp768: 'sp16' } });
	// @ts-expect-error — spacing keys are strings
	assertType<TrackProps>({ gap: 0 });
	// @ts-expect-error — Track supports only its three documented root elements
	assertType<TrackProps>({ elementType: 'section' });
	// @ts-expect-error — railAlignment is a closed union
	assertType<TrackProps>({ railAlignment: 'baseline' });
});
