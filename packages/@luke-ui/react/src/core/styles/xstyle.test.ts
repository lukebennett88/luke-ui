import * as stylex from '@stylexjs/stylex';
import { expect, test } from 'vite-plus/test';
import { resolveRacXStyleProps } from './xstyle.js';

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
