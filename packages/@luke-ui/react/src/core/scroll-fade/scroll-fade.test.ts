import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { ScrollFadeRecipeVariants } from './recipe.css.js';
import type { ScrollFadeProps } from './scroll-fade.js';

test('ScrollFade requires an accessible name for the div root', () => {
	// @ts-expect-error — div requires aria-label or aria-labelledby
	assertType<ScrollFadeProps>({ children: 'Content' });
	// @ts-expect-error — aria-label and aria-labelledby are mutually exclusive
	assertType<ScrollFadeProps>({
		'aria-label': 'Topics',
		'aria-labelledby': 'topics-heading',
		children: 'Content',
	});
});

test('ScrollFade rejects owned and polymorphic props', () => {
	assertType<ScrollFadeProps>({
		'aria-label': 'Topics',
		children: 'Content',
		// @ts-expect-error — ScrollFade always renders a div
		elementType: 'nav',
	});
	assertType<ScrollFadeProps>({
		'aria-label': 'Topics',
		children: 'Content',
		// @ts-expect-error — ScrollFade always renders a div
		elementType: 'span',
	});
	assertType<ScrollFadeProps>({
		'aria-label': 'Topics',
		children: 'Content',
		// @ts-expect-error — ScrollFade owns tabIndex from overflow
		tabIndex: 0,
	});
	assertType<ScrollFadeProps>({
		'aria-label': 'Topics',
		children: 'Content',
		// @ts-expect-error — ScrollFade owns overflow
		overflow: 'auto',
	});
	assertType<ScrollFadeProps>({
		'aria-label': 'Topics',
		children: 'Content',
		// @ts-expect-error — ScrollFade does not expose render
		render: () => null,
	});
	assertType<ScrollFadeProps>({
		'aria-label': 'Topics',
		children: 'Content',
		// @ts-expect-error — ScrollFade owns role
		role: 'region',
	});
});

test('ScrollFade axis is a closed scalar union', () => {
	expectTypeOf<'inline' | 'block' | undefined>().toEqualTypeOf<ScrollFadeProps['axis']>();
});

test('ScrollFadeRecipeVariants exposes axis only, not internal overflows state', () => {
	expectTypeOf<ScrollFadeRecipeVariants>().toEqualTypeOf<{ axis?: 'block' | 'inline' }>();
	// @ts-expect-error — overflows is internal runtime state, not a public recipe variant
	assertType<ScrollFadeRecipeVariants>({ overflows: true });
});
