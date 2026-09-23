import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { ScrollMaskProps } from './scroll-mask.js';

test('ScrollMask requires an accessible name for the default div root', () => {
	assertType<ScrollMaskProps>({
		'aria-label': 'Topics',
		children: 'Content',
	});
	assertType<ScrollMaskProps>({
		'aria-labelledby': 'topics-heading',
		children: 'Content',
	});
	// @ts-expect-error — default div requires aria-label or aria-labelledby
	assertType<ScrollMaskProps>({ children: 'Content' });
	// @ts-expect-error — aria-label and aria-labelledby are mutually exclusive
	assertType<ScrollMaskProps>({
		'aria-label': 'Topics',
		'aria-labelledby': 'topics-heading',
		children: 'Content',
	});
});

test('ScrollMask semantic roots keep native naming and reject owned props', () => {
	assertType<ScrollMaskProps>({
		children: 'Content',
		elementType: 'nav',
	});
	assertType<ScrollMaskProps>({
		'aria-label': 'Topics',
		children: 'Content',
		elementType: 'section',
	});
	assertType<ScrollMaskProps>({
		children: 'Content',
		elementType: 'aside',
		role: 'complementary',
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
	// @ts-expect-error — default div owns role
	assertType<ScrollMaskProps>({
		'aria-label': 'Topics',
		children: 'Content',
		role: 'region',
	});
});

test('ScrollMask rejects span as elementType', () => {
	assertType<ScrollMaskProps>({
		'aria-label': 'Topics',
		children: 'Content',
		// @ts-expect-error — span cannot host the ScrollMask scrollport
		elementType: 'span',
	});
});

test('ScrollMask axis is a closed scalar union', () => {
	expectTypeOf<'inline' | 'block' | undefined>().toEqualTypeOf<ScrollMaskProps['axis']>();
});
