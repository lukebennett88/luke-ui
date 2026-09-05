/** Type-level assertions that Button's recipe variant types stay exact literal unions. */

import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { ButtonRecipeVariants } from '../../../../dist/primitives/button.js';

type Variants = NonNullable<ButtonRecipeVariants>;

test('appearance is the exact literal union', () => {
	expectTypeOf<Variants['appearance']>().toEqualTypeOf<'ghost' | 'solid' | 'subtle' | undefined>();

	assertType<Variants['appearance']>('ghost');
	assertType<Variants['appearance']>('solid');
	assertType<Variants['appearance']>('subtle');
	// @ts-expect-error — not a member of the appearance union
	assertType<Variants['appearance']>('outline');
});

test('isBlock is boolean', () => {
	expectTypeOf<Variants['isBlock']>().toEqualTypeOf<boolean | undefined>();

	assertType<Variants['isBlock']>(true);
	assertType<Variants['isBlock']>(false);
	// @ts-expect-error — isBlock is boolean, not a string
	assertType<Variants['isBlock']>('true');
});

test('size is the exact literal union', () => {
	expectTypeOf<Variants['size']>().toEqualTypeOf<'medium' | 'small' | undefined>();

	assertType<Variants['size']>('medium');
	assertType<Variants['size']>('small');
	// @ts-expect-error — not a member of the size union
	assertType<Variants['size']>('large');
});

test('tone is the exact literal union', () => {
	expectTypeOf<Variants['tone']>().toEqualTypeOf<'accent' | 'danger' | 'neutral' | undefined>();

	assertType<Variants['tone']>('accent');
	assertType<Variants['tone']>('danger');
	assertType<Variants['tone']>('neutral');
	// @ts-expect-error — not a member of the tone union
	assertType<Variants['tone']>('info');
});
