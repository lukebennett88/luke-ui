/**
 * Compile-time guards on the public Track prop contract.
 *
 * Two exact assertions and four rejections. The exact ones matter because both unions are closed by
 * design: `elementType` is the documented set of root elements, and `railAlignment` must stay tied
 * to the recipe rather than drift into a hand-written copy.
 */

import { expect, expectTypeOf, test } from 'vite-plus/test';
import type { TrackRecipeVariants } from './recipe.css.js';
import type { TrackProps } from './track.js';

// @ts-expect-error — responsive gaps require an initial value
const responsiveGapWithoutInitial: TrackProps = { gap: { bp768: 'sp16' } };
// @ts-expect-error — spacing keys are strings
const numericZeroGap: TrackProps = { gap: 0 };
// @ts-expect-error — Track supports only its three documented root elements
const unsupportedElement: TrackProps = { elementType: 'section' };
// @ts-expect-error — Track owns its rail-alignment vocabulary
const unsupportedAlignment: TrackProps = { railAlignment: 'baseline' };

test('Track keeps its root element and rail alignment closed unions', () => {
	expectTypeOf<TrackProps['elementType']>().toEqualTypeOf<'div' | 'li' | 'span' | undefined>();
	expectTypeOf<TrackProps['railAlignment']>().toEqualTypeOf<
		NonNullable<TrackRecipeVariants>['railAlignment']
	>();
});

test('Track rejects the prop values it does not support', () => {
	expect([
		responsiveGapWithoutInitial,
		numericZeroGap,
		unsupportedElement,
		unsupportedAlignment,
	]).toHaveLength(4);
});
