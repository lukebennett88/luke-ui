import { createElement, createRef } from 'react';
import { expectTypeOf, test } from 'vite-plus/test';
import type { BoxProps } from './index.js';

const boxProps = {
	'aria-label': 'Account summary',
	display: { initial: 'block', medium: 'flex' },
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
	expectTypeOf(boxProps).toExtend<BoxProps>();
	expectTypeOf(boxProps.render).toExtend<BoxProps['render']>();
	expectTypeOf(boxProps.display).toEqualTypeOf<{
		initial: 'block';
		medium: 'flex';
	}>();
});
