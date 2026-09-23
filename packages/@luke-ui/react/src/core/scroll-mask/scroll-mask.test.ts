import { ScrollMask } from '@luke-ui/react/scroll-mask';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { assertType, expect, expectTypeOf, test } from 'vite-plus/test';
import type { ScrollMaskRecipeVariants } from './recipe.css.js';
import type { ScrollMaskProps } from './scroll-mask.js';

test('ScrollMask requires an accessible name for the div root', () => {
	assertType<ScrollMaskProps>({
		'aria-label': 'Topics',
		children: 'Content',
	});
	assertType<ScrollMaskProps>({
		'aria-labelledby': 'topics-heading',
		children: 'Content',
	});
	// @ts-expect-error — div requires aria-label or aria-labelledby
	assertType<ScrollMaskProps>({ children: 'Content' });
	// @ts-expect-error — aria-label and aria-labelledby are mutually exclusive
	assertType<ScrollMaskProps>({
		'aria-label': 'Topics',
		'aria-labelledby': 'topics-heading',
		children: 'Content',
	});
});

test('ScrollMask rejects owned and polymorphic props', () => {
	assertType<ScrollMaskProps>({
		'aria-label': 'Topics',
		children: 'Content',
		// @ts-expect-error — ScrollMask always renders a div
		elementType: 'nav',
	});
	assertType<ScrollMaskProps>({
		'aria-label': 'Topics',
		children: 'Content',
		// @ts-expect-error — ScrollMask always renders a div
		elementType: 'span',
	});
	assertType<ScrollMaskProps>({
		'aria-label': 'Topics',
		children: 'Content',
		// @ts-expect-error — ScrollMask owns tabIndex from overflow
		tabIndex: 0,
	});
	assertType<ScrollMaskProps>({
		'aria-label': 'Topics',
		children: 'Content',
		// @ts-expect-error — ScrollMask owns overflow
		overflow: 'auto',
	});
	assertType<ScrollMaskProps>({
		'aria-label': 'Topics',
		children: 'Content',
		// @ts-expect-error — ScrollMask does not expose render
		render: () => null,
	});
	assertType<ScrollMaskProps>({
		'aria-label': 'Topics',
		children: 'Content',
		// @ts-expect-error — ScrollMask owns role
		role: 'region',
	});
});

test('ScrollMask axis is a closed scalar union', () => {
	expectTypeOf<'inline' | 'block' | undefined>().toEqualTypeOf<ScrollMaskProps['axis']>();
});

test('ScrollMaskRecipeVariants exposes axis only, not internal overflows state', () => {
	expectTypeOf<ScrollMaskRecipeVariants>().toEqualTypeOf<{ axis?: 'block' | 'inline' }>();
	assertType<ScrollMaskRecipeVariants>({ axis: 'inline' });
	assertType<ScrollMaskRecipeVariants>({ axis: 'block' });
	assertType<ScrollMaskRecipeVariants>({});
	// @ts-expect-error — overflows is internal runtime state, not a public recipe variant
	assertType<ScrollMaskRecipeVariants>({ overflows: true });
});

test('SSR markup omits overflowing accessibility state', () => {
	const markup = renderToString(
		createElement(
			ScrollMask,
			{
				'aria-label': 'Hydrated list',
				inlineSize: '8rem',
				padding: 'sp8',
			},
			createElement(
				'span',
				{ style: { display: 'inline-block', inlineSize: '24rem', whiteSpace: 'nowrap' } },
				'Overflowing inline content for hydration',
			),
		),
	);

	expect(markup).not.toContain('role="region"');
	expect(markup).not.toMatch(/tabindex=/i);
	expect(markup).not.toContain('aria-label="Hydrated list"');
	expect(markup).toContain('Overflowing inline content for hydration');
});
