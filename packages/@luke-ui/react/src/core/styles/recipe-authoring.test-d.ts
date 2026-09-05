import * as stylex from '@stylexjs/stylex';
import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { RecipeSelection } from './recipe-authoring.js';
import { compiledStyle, compiledStyleList, recipe } from './recipe-authoring.js';

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

test('compiled style markers accept compiled styles and reject authored objects', () => {
	expectTypeOf(compiledStyle(styles.rootBase)).toEqualTypeOf<typeof styles.rootBase>();
	expectTypeOf(compiledStyleList([styles.rootBase, styles.trackBase])).toEqualTypeOf<
		readonly [typeof styles.rootBase, typeof styles.trackBase]
	>();
	// @ts-expect-error authored style objects are not compiled StyleX styles
	compiledStyle({ display: 'flex' });
	// @ts-expect-error arrays of authored style objects are not compiled StyleX arrays
	compiledStyleList([{ display: 'flex' }]);
});

test('a base-only recipe() rejects arbitrary selection keys', () => {
	const baseOnly = recipe({ base: styles.rootBase });
	baseOnly();
	baseOnly({});
	baseOnly({ xstyle: styles.rootLarge });
	// @ts-expect-error a recipe with no variants accepts no variant selection
	baseOnly({ size: 'small' });
	// @ts-expect-error a recipe with no variants rejects undefined values on fake keys
	baseOnly({ size: undefined });

	type Selection = RecipeSelection<typeof baseOnly>;
	// @ts-expect-error a base-only recipe's derived selection rejects any key
	assertType<Selection>({ size: 'small' });
});

test('a recipe() with an empty variants map rejects arbitrary selection keys', () => {
	const emptyVariants = recipe({ base: styles.rootBase, variants: {} });
	emptyVariants();
	emptyVariants({});
	// @ts-expect-error an empty variants map accepts no selection keys
	emptyVariants({ size: 'small' });
	// @ts-expect-error an empty variants map rejects undefined values on fake keys
	emptyVariants({ size: undefined });

	type Selection = RecipeSelection<typeof emptyVariants>;
	expectTypeOf<Selection>().toEqualTypeOf<Record<string, never>>();
});

test('recipe() infers exact literal unions, booleans, and numeric variant values', () => {
	const inferred = recipe({
		base: styles.rootBase,
		defaultVariants: { lineClamp: 1, loud: false, size: 'small' },
		variants: {
			lineClamp: { 1: styles.rootLarge, 2: styles.rootLoud, 3: null },
			loud: { false: null, true: styles.rootLoud },
			size: { large: styles.rootLarge, small: null },
		},
	});

	type Selection = RecipeSelection<typeof inferred>;
	expectTypeOf<Selection>().toEqualTypeOf<{
		lineClamp?: 1 | 2 | 3 | undefined;
		loud?: boolean | undefined;
		size?: 'large' | 'small' | undefined;
	}>();

	inferred({ lineClamp: 2, loud: true, size: 'large' });
	// A boolean group takes a real boolean, not the `'true'`/`'false'` keys it declares.
	// @ts-expect-error `'true'` is the declared key, not the selectable value
	inferred({ loud: 'true' });
	// @ts-expect-error `medium` is not a declared variant value
	inferred({ size: 'medium' });
	// @ts-expect-error `tone` is not a declared variant group
	inferred({ tone: 'accent' });
	// @ts-expect-error `4` is not a declared `lineClamp` value
	inferred({ lineClamp: 4 });
});

test('recipe() typechecks defaultVariants and compound conditions against the declared groups', () => {
	const undeclaredDefault = recipe({
		base: styles.rootBase,
		// @ts-expect-error `medium` is not a declared variant value for `size`
		defaultVariants: { size: 'medium' },
		variants: { size: { large: styles.rootLarge, small: null } },
	});
	void undeclaredDefault;

	const undeclaredCondition = recipe({
		base: styles.rootBase,
		// @ts-expect-error `tone` is not a declared variant group
		compoundVariants: [{ tone: 'accent', style: styles.rootLoud }],
		variants: { size: { large: styles.rootLarge, small: null } },
	});
	void undeclaredCondition;

	const valid = recipe({
		base: styles.rootBase,
		compoundVariants: [{ size: 'small', style: styles.rootLoud }],
		defaultVariants: { size: 'small' },
		variants: { size: { large: styles.rootLarge, small: null } },
	});
	expectTypeOf<RecipeSelection<typeof valid>>().toEqualTypeOf<{
		size?: 'large' | 'small' | undefined;
	}>();
});

test('a slotted recipe() infers its slot names and rejects undeclared ones', () => {
	const slotted = recipe({
		defaultVariants: { size: 'small' },
		slots: { root: styles.rootBase, track: styles.trackBase },
		variants: {
			// Styles only `root`; `track` is left unaffected by this value.
			size: { large: { root: styles.rootLarge }, small: null },
		},
	});

	expectTypeOf(slotted({ size: 'large' })).toHaveProperty('root');
	expectTypeOf(slotted({ size: 'large' })).toHaveProperty('track');
	slotted({ size: 'large', xstyle: { track: styles.trackLarge } });
	// @ts-expect-error `bogus` is not a declared slot
	slotted({ xstyle: { bogus: styles.trackLarge } });
	// @ts-expect-error `tone` is not a declared variant group
	slotted({ tone: 'accent' });
});

test('a slotted recipe() with no variants rejects arbitrary selection keys', () => {
	const noVariantSlotted = recipe({ slots: { root: styles.rootBase } });
	noVariantSlotted();
	noVariantSlotted({});
	noVariantSlotted({ xstyle: { root: styles.rootLarge } });
	// @ts-expect-error a slotted recipe with no variants accepts no variant selection
	noVariantSlotted({ bogus: 'x' });
	// @ts-expect-error a slotted recipe with no variants rejects undefined on fake keys
	noVariantSlotted({ bogus: undefined });

	type Selection = RecipeSelection<typeof noVariantSlotted>;
	expectTypeOf<Selection>().toEqualTypeOf<Record<string, never>>();
});
