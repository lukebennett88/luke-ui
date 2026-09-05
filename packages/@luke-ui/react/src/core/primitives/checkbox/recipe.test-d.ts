import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { CheckboxRecipeVariants } from '../../../../dist/primitives/checkbox.js';
import { checkboxRecipe } from '../../../../dist/primitives/checkbox.js';

type Variants = NonNullable<CheckboxRecipeVariants>;

test('Checkbox recipe exposes only its public size variant', () => {
	expectTypeOf<Variants>().toEqualTypeOf<{
		size?: 'large' | 'medium' | 'small' | undefined;
	}>();
	assertType<Variants['size']>('large');
	assertType<Variants['size']>('medium');
	assertType<Variants['size']>('small');
	// @ts-expect-error — state is private to Checkbox rendering
	assertType<Variants['isSelected']>(true);
});

test('Checkbox recipe rejects private interaction state', () => {
	expectTypeOf(checkboxRecipe()).toHaveProperty('root');
	checkboxRecipe();
	checkboxRecipe({ size: 'small' });
	// @ts-expect-error — state is private to Checkbox rendering
	checkboxRecipe({ isSelected: true });
	// @ts-expect-error — state is private to Checkbox rendering
	checkboxRecipe({ isDisabled: true });
	// @ts-expect-error — state is private to Checkbox rendering
	checkboxRecipe({ isHovered: true });
});
