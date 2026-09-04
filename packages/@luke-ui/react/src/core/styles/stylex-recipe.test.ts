import * as stylex from '@stylexjs/stylex';
import { expect, expectTypeOf, test } from 'vite-plus/test';
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
	trackBase: {
		position: 'relative',
	},
	trackLarge: {
		blockSize: '8px',
	},
});

const trackRecipeStyles = createSlottedRecipeStyles({
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
const track = createSlottedRecipe(trackRecipeStyles);
const resolveSlotStyles = trackRecipeStyles.resolveSlotStyles;

test('each slot only carries the classes it declares a style for', () => {
	const slots = track({ size: 'large' });
	const rootClasses = stylex.props(styles.rootBase, styles.rootLarge).className?.split(' ') ?? [];
	const trackClasses =
		stylex.props(styles.trackBase, styles.trackLarge).className?.split(' ') ?? [];

	expect(slots.root.className?.split(' ')).toEqual(rootClasses);
	expect(slots.track.className?.split(' ')).toEqual(trackClasses);
});

test('a slot only reads the variant groups that target it', () => {
	// `root` and `track` both declare a `size` style, but a group no slot declares must not
	// contribute a class to any of them, and must not throw when selected.
	const rootOnlyStyles = createSlottedRecipeStyles({
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
	const rootOnly = createSlottedRecipe(rootOnlyStyles);

	const slots = rootOnly({ size: 'large' });
	expect(slots.root.className?.split(' ')).toEqual(
		stylex.props(styles.rootBase, styles.rootLarge).className?.split(' ') ?? [],
	);
	// `track` declares no `size` style, so the selection leaves it at its base classes.
	expect(slots.track.className?.split(' ')).toEqual(
		stylex.props(styles.trackBase).className?.split(' ') ?? [],
	);
});

test('each slot resolves to the same classes on repeated calls', () => {
	const first = track({ size: 'large' });
	const second = track({ size: 'large' });
	expect(first.root).toEqual(second.root);
	expect(first.track).toEqual(second.track);
});

test('resolveSlotStyles builds the same record as the slotted recipe', () => {
	const resolved = {
		root: resolveSlotStyles('root', { size: 'large' }),
		track: resolveSlotStyles('track', { size: 'large' }),
	};
	expect(resolved.root).toEqual([styles.rootBase, styles.rootLarge]);
	expect(resolved.track).toEqual([styles.trackBase, styles.trackLarge]);
});

test("resolving one slot never reads another slot's variant style", () => {
	let trackVariantReads = 0;
	const largeStyles = {
		root: styles.rootLarge,
		get track(): typeof styles.trackLarge {
			trackVariantReads += 1;
			return styles.trackLarge;
		},
	};

	const trickyStyles = createSlottedRecipeStyles({
		slots: {
			root: styles.rootBase,
			track: styles.trackBase,
		},
		variants: {
			size: {
				large: largeStyles,
			},
		},
	});
	const tricky = createSlottedRecipe(trickyStyles);

	expect(trackVariantReads).toBe(0);

	const slots = tricky({ size: 'large' });
	void slots.root;
	trickyStyles.resolveSlotStyles('root', { size: 'large' });

	expect(trackVariantReads).toBe(0);

	void slots.track;
	expect(trackVariantReads).toBe(1);
});

test('createSlottedRecipe resolves each slot from the same resolveSlotStyles operation', () => {
	const track2RecipeStyles = createSlottedRecipeStyles({
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
	const track2 = createSlottedRecipe(track2RecipeStyles);

	const fromSlot = track2({ size: 'large' }).track.className;
	const fromResolveSlotStyles = stylex.props(
		...track2RecipeStyles.resolveSlotStyles('track', { size: 'large' }),
	).className;

	expect(fromSlot).toBe(fromResolveSlotStyles);
});

test('a compound variant with no conditions always applies', () => {
	// An empty condition set matches every selection.
	const always = createRecipe(
		createRecipeStyles({
			base: styles.rootBase,
			compoundVariants: [{ style: styles.rootLarge, variants: {} }],
		}),
	);

	expect(always().className?.split(' ')).toEqual(
		stylex.props(styles.rootBase, styles.rootLarge).className?.split(' ') ?? [],
	);
});

test('base accepts an array of unconditional styles, applied in order', () => {
	const always = createRecipe(
		createRecipeStyles({
			base: [styles.rootBase, styles.rootLarge],
		}),
	);

	expect(always().className?.split(' ')).toEqual(
		stylex.props(styles.rootBase, styles.rootLarge).className?.split(' ') ?? [],
	);
});

test('a null variant value is skipped, contributing no class', () => {
	const resolveStyles = createRecipeStyles({
		defaultVariants: { tone: 'neutral' },
		variants: {
			tone: {
				accent: styles.rootLarge,
				neutral: null,
			},
		},
	});

	expect(resolveStyles()).toEqual([]);
	expect(resolveStyles({ tone: 'accent' })).toEqual([styles.rootLarge]);
});

test('RecipeSelection derives the outer variant selection type from a single-part resolver', () => {
	const resolveStyles = createRecipeStyles({
		variants: { size: { large: styles.rootLarge } },
	});
	type Selection = RecipeSelection<typeof resolveStyles>;
	expectTypeOf<Selection>().toEqualTypeOf<{ size?: 'large' | undefined }>();
});

test('SlotRecipeSelection derives the outer variant selection type from a slotted resolver', () => {
	type Selection = SlotRecipeSelection<typeof resolveSlotStyles>;
	expectTypeOf<Selection>().toEqualTypeOf<{ size?: 'large' | undefined }>();
});
