import * as stylex from '@stylexjs/stylex';
import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';
import { createRecipe, createRecipeStyles } from './stylex-recipe.js';

const styles = stylex.create({
	base: {
		display: 'flex',
	},
	compound: {
		color: 'rgb(7, 8, 9)',
	},
	sizeLarge: {
		color: 'rgb(10, 20, 30)',
	},
	sizeSmall: {
		color: 'rgb(1, 2, 3)',
	},
	toneAccent: {
		color: 'rgb(4, 5, 6)',
	},
	toneNeutral: {
		color: 'rgb(40, 50, 60)',
	},
});

const resolveStyles = createRecipeStyles({
	base: styles.base,
	compoundVariants: [
		{
			style: styles.compound,
			variants: { size: 'large', tone: 'accent' },
		},
	],
	defaultVariants: { size: 'small', tone: 'neutral' },
	variants: {
		size: {
			large: styles.sizeLarge,
			small: styles.sizeSmall,
		},
		tone: {
			accent: styles.toneAccent,
			neutral: styles.toneNeutral,
		},
	},
});

const button = createRecipe(resolveStyles);

function computedFor(className: string | undefined) {
	const { container } = render(<div className={className} />);
	return getComputedStyle(container.firstElementChild as HTMLElement);
}

test('resolves base and default variants', () => {
	const computed = computedFor(button().className);
	expect(computed.display).toBe('flex');
	expect(computed.color).toBe('rgb(40, 50, 60)');
	expect(resolveStyles()).toContainEqual(styles.sizeSmall);
	expect(resolveStyles()).toContainEqual(styles.toneNeutral);
});

test('an explicit undefined in the selection falls through to the default, like the Vanilla Extract engine', () => {
	// A component that spreads a partly-optional prop object straight into its recipe call (as
	// `Text` does) can pass an explicit `undefined` for an unset prop, not omit the key entirely.
	const computed = computedFor(button({ size: undefined, tone: undefined }).className);
	expect(computed.color).toBe('rgb(40, 50, 60)');
	expect(resolveStyles({ size: undefined, tone: undefined })).toContainEqual(styles.sizeSmall);
	expect(resolveStyles({ size: undefined, tone: undefined })).toContainEqual(styles.toneNeutral);
});

test('explicit size is distinct from the default size', () => {
	expect(resolveStyles()).toContainEqual(styles.sizeSmall);
	expect(resolveStyles()).not.toContainEqual(styles.sizeLarge);
	expect(resolveStyles({ size: 'large' })).toContainEqual(styles.sizeLarge);
	expect(resolveStyles({ size: 'large' })).not.toContainEqual(styles.sizeSmall);
});

test('explicit tone is distinct from the default tone', () => {
	expect(resolveStyles()).toContainEqual(styles.toneNeutral);
	expect(resolveStyles()).not.toContainEqual(styles.toneAccent);
	expect(resolveStyles({ tone: 'accent' })).toContainEqual(styles.toneAccent);
	expect(resolveStyles({ tone: 'accent' })).not.toContainEqual(styles.toneNeutral);
	expect(computedFor(button({ size: 'small', tone: 'accent' }).className).color).toBe(
		'rgb(4, 5, 6)',
	);
	expect(computedFor(button().className).color).toBe('rgb(40, 50, 60)');
});

test('a later variant group wins over an earlier one for the same property', () => {
	const computed = computedFor(button({ size: 'large', tone: 'neutral' }).className);
	expect(computed.color).toBe('rgb(40, 50, 60)');
});

test('a compound variant wins over the simple variants it overlaps', () => {
	const computed = computedFor(button({ size: 'large', tone: 'accent' }).className);
	expect(computed.color).toBe('rgb(7, 8, 9)');
});

test('returns the full stylex.props(...) output, not a bare class string', () => {
	expect(typeof button().className).toBe('string');
	expect(button()).toEqual(stylex.props(...resolveStyles()));
});
