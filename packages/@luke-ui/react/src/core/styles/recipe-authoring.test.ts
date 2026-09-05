import * as stylex from '@stylexjs/stylex';
import { expect, expectTypeOf, test } from 'vite-plus/test';
import type { RecipeSelection } from './recipe-authoring.js';
import { compiledStyle, compiledStyleList, recipe } from './recipe-authoring.js';

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

const sharedStyles = stylex.create({
	shared: { textTransform: 'uppercase' },
});

const aliasedStyle = sharedStyles.shared;

const groupedStyles = {
	large: styles.rootLarge,
} as const;

test('compiled style markers preserve their values at runtime', () => {
	const list = [styles.rootBase, styles.trackBase] as const;
	expect(compiledStyle(styles.rootBase)).toBe(styles.rootBase);
	expect(compiledStyleList(list)).toBe(list);
});

const singlePart = recipe({
	base: styles.rootBase,
	compoundVariants: [{ size: 'large', tone: 'loud', style: styles.trackLarge }],
	defaultVariants: { size: 'small', tone: 'quiet' },
	variants: {
		size: { large: styles.rootLarge, small: null },
		tone: { loud: styles.trackBase, quiet: null },
	},
});

const slotted = recipe({
	compoundVariants: [{ size: 'large', style: { track: styles.trackLarge } }],
	defaultVariants: { size: 'small' },
	slots: { root: styles.rootBase, track: styles.trackBase },
	variants: {
		size: { large: { root: styles.rootLarge }, small: null },
	},
});

test('a single-part recipe applies base, then variant groups in author order, then compounds', () => {
	expect(singlePart({ size: 'large', tone: 'loud' })).toEqual(
		stylex.props(styles.rootBase, styles.rootLarge, styles.trackBase, styles.trackLarge),
	);
});

test('a single-part recipe applies its default variants when none are selected', () => {
	expect(singlePart()).toEqual(stylex.props(styles.rootBase));
});

test('an explicit undefined falls through to the default rather than clearing it', () => {
	expect(singlePart({ size: undefined, tone: 'loud' })).toEqual(
		stylex.props(styles.rootBase, styles.trackBase),
	);
});

test('a compound variant is skipped unless every one of its conditions matches', () => {
	expect(singlePart({ size: 'large', tone: 'quiet' })).toEqual(
		stylex.props(styles.rootBase, styles.rootLarge),
	);
});

test('a single-part recipe resolves a consumer xstyle after its own styles', () => {
	expect(singlePart({ size: 'large', xstyle: styles.trackLarge })).toEqual(
		stylex.props(styles.rootBase, styles.rootLarge, styles.trackLarge),
	);
});

test('a slotted recipe returns plain props objects, one per slot', () => {
	const parts = slotted({ size: 'large' });

	expect(Object.keys(parts)).toEqual(['root', 'track']);
	expect(parts.root).toEqual(stylex.props(styles.rootBase, styles.rootLarge));
	expect(parts.track).toEqual(stylex.props(styles.trackBase, styles.trackLarge));
});

test('a slotted recipe applies each xstyle only to the slot it was given for', () => {
	const parts = slotted({ size: 'small', xstyle: { track: styles.rootLarge } });

	expect(parts.root).toEqual(stylex.props(styles.rootBase));
	expect(parts.track).toEqual(stylex.props(styles.trackBase, styles.rootLarge));
});

test('a slot variant value styling one slot leaves the others at their base styles', () => {
	const parts = slotted({ size: 'large' });
	expect(parts.root).toEqual(stylex.props(styles.rootBase, styles.rootLarge));
});

test('a compiled style referenced by a recipe keeps its own single set of classes', () => {
	const referencing = recipe({
		base: [aliasedStyle, { display: 'grid' }],
		variants: { size: { large: groupedStyles.large, small: sharedStyles.shared } },
	});

	const sharedClasses = stylex.props(sharedStyles.shared).className;
	const largeClasses = stylex.props(styles.rootLarge).className;

	const large = referencing({ size: 'large' }).className?.split(' ') ?? [];
	expect(large).toEqual(expect.arrayContaining([sharedClasses, largeClasses]));

	const small = referencing({ size: 'small' }).className?.split(' ') ?? [];
	expect(small.filter((className) => className === sharedClasses)).toEqual([sharedClasses]);
});

test('a recipe with no variants resolves its base alone', () => {
	const baseOnly = recipe({ base: styles.rootBase });
	expect(baseOnly()).toEqual(stylex.props(styles.rootBase));
});

test('RecipeSelection derives the variant selection type without the xstyle key', () => {
	type Selection = RecipeSelection<typeof singlePart>;
	expectTypeOf<Selection>().toEqualTypeOf<{
		size?: 'large' | 'small' | undefined;
		tone?: 'loud' | 'quiet' | undefined;
	}>();
});
