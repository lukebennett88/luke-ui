import * as stylex from '@stylexjs/stylex';
import { expect, test } from 'vite-plus/test';
import { composeRacRecipeProps, composeRecipeProps, resolveRacXStyleProps } from './xstyle.js';

const styles = stylex.create({
	base: { color: 'red' },
	variant: { color: 'blue' },
});

test('enforces internal styles < variants < xstyle < className < inline style', () => {
	const xstyle = stylex.create({ override: { color: 'green' } }).override;

	const baseOnly = resolveRacXStyleProps(
		[styles.base, styles.variant],
		undefined,
		undefined,
		undefined,
	);
	expect(baseOnly.className(undefined)).toBe(stylex.props(styles.base, styles.variant).className);

	const withXstyle = resolveRacXStyleProps(
		[styles.base, styles.variant],
		xstyle,
		undefined,
		undefined,
	);
	expect(withXstyle.className(undefined)).toBe(
		stylex.props(styles.base, styles.variant, xstyle).className,
	);

	const withClassName = resolveRacXStyleProps(
		[styles.base, styles.variant],
		xstyle,
		'consumer-class',
		undefined,
	);
	// A consumer class name is appended after the compiled classes, so it wins the cascade.
	expect(withClassName.className(undefined)).toBe(
		`${stylex.props(styles.base, styles.variant, xstyle).className} consumer-class`,
	);

	const withInlineStyle = resolveRacXStyleProps(
		[styles.base, styles.variant],
		xstyle,
		'consumer-class',
		{ color: 'yellow' },
	);
	// Inline style beats every class-based source, including xstyle and className.
	expect(withInlineStyle.style(undefined)).toEqual({ color: 'yellow' });
});

test('resolves function-valued className and style, passing render props through', () => {
	const xstyle = stylex.create({ override: { color: 'green' } }).override;
	const renderProps: { isHovered: boolean } = { isHovered: true };

	const resolved = resolveRacXStyleProps(
		[styles.base],
		xstyle,
		(props: typeof renderProps) => (props.isHovered ? 'hovered' : ''),
		(props: typeof renderProps) => (props.isHovered ? { opacity: 0.5 } : undefined),
	);

	expect(resolved.className(renderProps)).toBe(
		`${stylex.props(styles.base, xstyle).className} hovered`,
	);
	expect(resolved.style(renderProps)).toEqual({
		...stylex.props(styles.base, xstyle).style,
		opacity: 0.5,
	});
});

test('preserves extra stylex props when composing recipe results', () => {
	const resolved = composeRacRecipeProps(
		{
			className: 'recipe-class',
			style: { color: 'red' },
			'data-style-src': 'recipe.ts:1',
		},
		'consumer-class',
		{ opacity: 0.5 },
	);

	expect(resolved['data-style-src']).toBe('recipe.ts:1');
	expect(resolved.className({})).toBe('recipe-class consumer-class');
	expect(resolved.style({})).toEqual({ color: 'red', opacity: 0.5 });
});

test('composes plain element recipe props with a consumer className and style', () => {
	const resolved = composeRecipeProps(
		{
			className: 'recipe-class',
			style: { color: 'red', opacity: 1 },
			'data-style-src': 'recipe.ts:1',
		},
		{ className: 'consumer-class', style: { opacity: 0.5 } },
	);

	// A consumer class name is appended last, so it wins the cascade, and a consumer inline style
	// wins per property while leaving the recipe's other declarations in place.
	expect(resolved.className).toBe('recipe-class consumer-class');
	expect(resolved.style).toEqual({ color: 'red', opacity: 0.5 });
	expect(resolved['data-style-src']).toBe('recipe.ts:1');
});

test('keeps the recipe style intact when the consumer passes no inline style', () => {
	const resolved = composeRecipeProps(
		{ className: 'recipe-class', style: { color: 'red' } },
		{ className: undefined, style: undefined },
	);

	expect(resolved.className).toBe('recipe-class');
	expect(resolved.style).toEqual({ color: 'red' });
});

test('omits empty className and style attributes when nothing resolves any styles', () => {
	// `mergeProps` assigns `className` and `style` unconditionally, which would otherwise produce
	// `className: ''` and `style: {}` here — rendering as empty `class=""` and `style` attributes.
	const resolved = composeRecipeProps({}, { className: undefined, style: undefined });

	expect(resolved.className).toBeUndefined();
	expect(resolved.style).toBeUndefined();
});
