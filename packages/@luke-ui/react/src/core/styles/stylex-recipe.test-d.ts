/** Type-level assertions against the recipe factories' variant-selection contract. */

import * as stylex from '@stylexjs/stylex';
import { assertType, expectTypeOf, test } from 'vite-plus/test';
import {
	createRecipe,
	createRecipeStyles,
	createSlottedRecipe,
	createSlottedRecipeStyles,
} from './stylex-recipe.js';
import type { RecipeSelection, SlotRecipeSelection } from './stylex-recipe.js';

const styles = stylex.create({
	rootBase: {
		display: 'flex',
	},
	rootLarge: {
		padding: '16px',
	},
	rootLoud: {
		fontWeight: 'bold',
	},
	trackBase: {
		position: 'relative',
	},
	trackLarge: {
		blockSize: '8px',
	},
});

test('a single-part recipe with no variants rejects arbitrary selection keys', () => {
	const noVariantStyles = createRecipeStyles({ base: styles.rootBase });
	noVariantStyles();
	noVariantStyles({});
	// @ts-expect-error a recipe with no variants accepts no selection
	noVariantStyles({ completelyMadeUpVariant: 'whatever' });

	const noVariantRecipe = createRecipe(noVariantStyles);
	noVariantRecipe();
	noVariantRecipe({});
	// @ts-expect-error a recipe with no variants accepts no selection
	noVariantRecipe({ size: 'small' });

	type Selection = RecipeSelection<typeof noVariantStyles>;
	// @ts-expect-error a no-variant recipe's derived selection rejects any key
	assertType<Selection>({ size: 'small' });
});

test('a slotted recipe with no variants rejects arbitrary selection keys', () => {
	const noVariantSlottedStyles = createSlottedRecipeStyles({
		slots: { root: styles.rootBase },
	});
	noVariantSlottedStyles.resolveSlotStyles('root');
	noVariantSlottedStyles.resolveSlotStyles('root', {});
	// @ts-expect-error a recipe with no variants accepts no selection
	noVariantSlottedStyles.resolveSlotStyles('root', { bogus: 'x' });

	const noVariantSlotted = createSlottedRecipe(noVariantSlottedStyles);
	noVariantSlotted();
	noVariantSlotted({});
	// @ts-expect-error a recipe with no variants accepts no selection
	noVariantSlotted({ bogus: 'x' });

	type Selection = SlotRecipeSelection<typeof noVariantSlottedStyles.resolveSlotStyles>;
	// @ts-expect-error a no-variant slotted recipe's derived selection rejects any key
	assertType<Selection>({ bogus: 'x' });
});

test('exact literal unions are accepted and undeclared values or groups are rejected', () => {
	const resolveStyles = createRecipeStyles({
		base: styles.rootBase,
		variants: {
			size: { large: styles.rootLarge, small: null },
		},
	});

	expectTypeOf(resolveStyles)
		.parameter(0)
		.toEqualTypeOf<{ size?: 'large' | 'small' | undefined } | undefined>();

	resolveStyles({ size: 'small' });
	resolveStyles({ size: 'large' });
	// @ts-expect-error `medium` is not a declared variant value
	resolveStyles({ size: 'medium' });
	// @ts-expect-error `tone` is not a declared variant group
	resolveStyles({ tone: 'accent' });
});

test('boolean-mapped variant groups select as a real boolean', () => {
	const resolveStyles = createRecipeStyles({
		base: styles.rootBase,
		variants: {
			loud: { true: styles.rootLoud, false: null },
		},
	});

	resolveStyles({ loud: true });
	resolveStyles({ loud: false });
	expectTypeOf(resolveStyles)
		.parameter(0)
		.toEqualTypeOf<{ loud?: boolean | undefined } | undefined>();
});

test('defaultVariants typecheck against the declared groups', () => {
	const resolveStyles = createRecipeStyles({
		base: styles.rootBase,
		defaultVariants: { size: 'small' },
		variants: {
			size: { large: styles.rootLarge, small: null },
		},
	});

	type Selection = RecipeSelection<typeof resolveStyles>;
	expectTypeOf<Selection>().toEqualTypeOf<{ size?: 'large' | 'small' | undefined }>();
	resolveStyles();

	createRecipeStyles({
		base: styles.rootBase,
		// @ts-expect-error `medium` is not a declared variant value for `size`
		defaultVariants: { size: 'medium' },
		variants: {
			size: { large: styles.rootLarge, small: null },
		},
	});
});

test('a null variant value stays selectable in the public union', () => {
	const resolveStyles = createRecipeStyles({
		base: styles.rootBase,
		variants: {
			size: { large: styles.rootLarge, small: null },
		},
	});

	type Selection = RecipeSelection<typeof resolveStyles>;
	expectTypeOf<Selection>().toEqualTypeOf<{ size?: 'large' | 'small' | undefined }>();
});

test('compound variants typecheck against the declared groups', () => {
	const resolveStyles = createRecipeStyles({
		base: styles.rootBase,
		compoundVariants: [{ style: styles.rootLarge, variants: { loud: true, size: 'small' } }],
		variants: {
			loud: { true: styles.rootLoud, false: null },
			size: { large: styles.rootLarge, small: null },
		},
	});

	type Selection = RecipeSelection<typeof resolveStyles>;
	expectTypeOf<Selection>().toEqualTypeOf<{
		loud?: boolean | undefined;
		size?: 'large' | 'small' | undefined;
	}>();
	assertType<Selection>({ loud: true, size: 'small' });
});

test('a partial slotted variant map is accepted and an invalid slot name errors', () => {
	const partialSlotStyles = createSlottedRecipeStyles({
		slots: { root: styles.rootBase, track: styles.trackBase },
		variants: {
			size: {
				// Styles only `root`; `track` is left unaffected by this value.
				large: { root: styles.rootLarge },
			},
		},
	});
	type Selection = SlotRecipeSelection<typeof partialSlotStyles.resolveSlotStyles>;
	expectTypeOf<Selection>().toEqualTypeOf<{ size?: 'large' | undefined }>();
	assertType<Selection>({ size: 'large' });

	createSlottedRecipeStyles({
		slots: { root: styles.rootBase, track: styles.trackBase },
		variants: {
			size: {
				// @ts-expect-error `bogusSlot` is not a declared slot name
				large: { bogusSlot: styles.rootLarge },
			},
		},
	});
});

test('SlotRecipeSelection derives the exact selection type for a slotted resolver', () => {
	const trackRecipeStyles = createSlottedRecipeStyles({
		slots: { root: styles.rootBase, track: styles.trackBase },
		variants: {
			size: {
				large: { root: styles.rootLarge, track: styles.trackLarge },
			},
		},
	});

	type Selection = SlotRecipeSelection<typeof trackRecipeStyles.resolveSlotStyles>;
	expectTypeOf<Selection>().toEqualTypeOf<{ size?: 'large' | undefined }>();
});
