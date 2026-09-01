import * as stylex from '@stylexjs/stylex';
import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';
import { recipe } from './stylex-recipe.js';

const styles = stylex.create({
	base: {
		display: 'flex',
	},
	compound: {
		outlineStyle: 'dashed',
	},
	sizeLarge: {
		fontSize: '20px',
	},
	sizeSmall: {
		fontSize: '12px',
	},
	toneAccent: {
		color: 'rgb(4, 5, 6)',
	},
});

const button = recipe({
	base: styles.base,
	compoundVariants: [
		{
			style: styles.compound,
			variants: { size: 'large', tone: 'accent' },
		},
	],
	defaultVariants: { size: 'small', tone: 'accent' },
	variants: {
		size: {
			large: styles.sizeLarge,
			small: styles.sizeSmall,
		},
		tone: {
			accent: styles.toneAccent,
		},
	},
});

function computedFor(className: string) {
	const { container } = render(<div className={className} />);
	return getComputedStyle(container.firstElementChild as HTMLElement);
}

test('resolves base and default variants', () => {
	const computed = computedFor(button());
	expect(computed.display).toBe('flex');
	expect(computed.fontSize).toBe('12px');
	expect(computed.color).toBe('rgb(4, 5, 6)');
});

test('a later variant group wins over an earlier one for the same property', () => {
	const computed = computedFor(button({ size: 'large' }));
	expect(computed.fontSize).toBe('20px');
});

test('a compound variant wins over the simple variants it overlaps', () => {
	const computed = computedFor(button({ size: 'large', tone: 'accent' }));
	expect(computed.outlineStyle).toBe('dashed');
	// The compound's own declared properties still let the simple variant's other
	// properties (font-size) stand, proving the compound did not replace the whole style.
	expect(computed.fontSize).toBe('20px');
});

test('returns only a class string, never a StyleX style object', () => {
	expect(typeof button()).toBe('string');
});
