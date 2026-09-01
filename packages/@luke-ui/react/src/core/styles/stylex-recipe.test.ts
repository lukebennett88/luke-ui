import * as stylex from '@stylexjs/stylex';
import { expect, expectTypeOf, test } from 'vite-plus/test';
import { recipe } from './stylex-recipe.js';
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

const track = recipe({
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

test('slots evaluate lazily: reading one does not compute the others', () => {
	const slots = track({ size: 'large' });
	// Calling only `root` must not throw even though `track` was never read.
	expect(() => slots.root()).not.toThrow();
});

test('slot functions merge an optional extra class, appended last', () => {
	const slots = track();
	expect(slots.root('extra-class').split(' ')).toContain('extra-class');
	expect(slots.root('extra-class').endsWith('extra-class')).toBe(true);
});

test('RecipeSelection derives the outer variant selection type', () => {
	type Selection = RecipeSelection<typeof track>;
	expectTypeOf<Selection>().toEqualTypeOf<{ size?: 'large' | undefined }>();
});
