import * as stylex from '@stylexjs/stylex';
import { expect, expectTypeOf, test } from 'vite-plus/test';
import { createSingleRecipe, createSlottedRecipe } from './stylex-recipe.js';
import type { RecipeSelection } from './stylex-recipe.js';

const styles = stylex.create({
	rootBase: {
		display: 'flex',
	},
	rootLarge: {
		padding: '16px',
	},
	trackBase: {
		position: 'relative',
	},
	trackLarge: {
		blockSize: '8px',
	},
});

const { recipe: track, resolveStyles } = createSlottedRecipe({
	slots: {
		root: styles.rootBase,
		track: styles.trackBase,
	},
	variants: {
		size: {
			large: {
				root: styles.rootLarge,
				track: styles.trackLarge,
			},
		},
	},
});

test('each slot only carries the classes it declares a style for', () => {
	const slots = track({ size: 'large' });
	const rootClasses = stylex.props(styles.rootBase, styles.rootLarge).className?.split(' ') ?? [];
	const trackClasses =
		stylex.props(styles.trackBase, styles.trackLarge).className?.split(' ') ?? [];

	expect(slots.root().split(' ')).toEqual(rootClasses);
	expect(slots.track().split(' ')).toEqual(trackClasses);
});

test('a slot only reads the variant groups that target it', () => {
	// `root` and `track` both declare a `size` style, but a group no slot declares must not
	// contribute a class to any of them, and must not throw when selected.
	const { recipe: rootOnly } = createSlottedRecipe({
		slots: {
			root: styles.rootBase,
			track: styles.trackBase,
		},
		variants: {
			size: {
				large: { root: styles.rootLarge },
			},
		},
	});

	const slots = rootOnly({ size: 'large' });
	expect(slots.root().split(' ')).toEqual(
		stylex.props(styles.rootBase, styles.rootLarge).className?.split(' ') ?? [],
	);
	// `track` declares no `size` style, so the selection leaves it at its base classes.
	expect(slots.track().split(' ')).toEqual(
		stylex.props(styles.trackBase).className?.split(' ') ?? [],
	);
});

test('each slot function returns the same classes on repeated calls', () => {
	const slots = track({ size: 'large' });
	expect(slots.root()).toBe(slots.root());
	expect(slots.track()).toBe(slots.track());
});

test('slot functions merge an optional extra class, appended last', () => {
	const slots = track();
	expect(slots.root('extra-class').split(' ')).toContain('extra-class');
	expect(slots.root('extra-class').endsWith('extra-class')).toBe(true);
});

test('resolveStyles returns per-slot compiled style arrays', () => {
	const resolved = resolveStyles({ size: 'large' });
	expect(resolved.root).toEqual([styles.rootBase, styles.rootLarge]);
	expect(resolved.track).toEqual([styles.trackBase, styles.trackLarge]);
});

test('a compound variant with no conditions always applies', () => {
	// `button/styles.ts` relies on this to append a second unconditional style to a single-part
	// base, because StyleX cannot spread an imported compiled style into `stylex.create`.
	const { recipe: always } = createSingleRecipe({
		base: styles.rootBase,
		compoundVariants: [{ style: styles.rootLarge, variants: {} }],
	});

	expect(always().split(' ')).toEqual(
		stylex.props(styles.rootBase, styles.rootLarge).className?.split(' ') ?? [],
	);
});

test('RecipeSelection derives the outer variant selection type', () => {
	type Selection = RecipeSelection<typeof track>;
	expectTypeOf<Selection>().toEqualTypeOf<{ size?: 'large' | undefined }>();
});
