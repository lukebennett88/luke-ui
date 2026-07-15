import { createElement, createRef } from 'react';
import { expectTypeOf, test } from 'vite-plus/test';
import type { BoxProps } from './index.js';

const boxProps = {
	'aria-label': 'Account summary',
	display: { medium: 'flex', xsmall: 'block' },
	id: 'account-summary',
	onClick: () => undefined,
	padding: '400',
	ref: createRef<HTMLDivElement>(),
	render: (domProps, renderProps) => {
		expectTypeOf(renderProps).toEqualTypeOf<undefined>();

		return createElement('div', domProps);
	},
} satisfies BoxProps;

// Type assertions are compile-time only.
// oxlint-disable-next-line vitest/expect-expect
test('preserves native DOM, render, and responsive layout props', () => {
	expectTypeOf(boxProps).toMatchTypeOf<BoxProps>();
	expectTypeOf(boxProps.render).toMatchTypeOf<BoxProps['render']>();
	expectTypeOf(boxProps.display).toEqualTypeOf<{
		medium: 'flex';
		xsmall: 'block';
	}>();
});
