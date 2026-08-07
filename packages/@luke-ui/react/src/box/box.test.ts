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

const anchorBoxProps = {
	elementType: 'a',
	href: '/account',
	padding: '400',
} satisfies BoxProps<'a'>;

function acceptsBoxProps(props: BoxProps): BoxProps {
	return props;
}

function acceptsAnchorBoxProps(props: BoxProps<'a'>): BoxProps<'a'> {
	return props;
}

// Type assertions are compile-time only.
// oxlint-disable-next-line vitest/expect-expect
test('types DOM props from the chosen element and keeps elementType and render exclusive', () => {
	expectTypeOf(boxProps).toExtend<BoxProps>();
	expectTypeOf(boxProps.render).toExtend<BoxProps['render']>();
	expectTypeOf(boxProps.display).toEqualTypeOf<{
		initial: 'block';
		medium: 'flex';
	}>();
	expectTypeOf(anchorBoxProps).toExtend<BoxProps<'a'>>();

	// @ts-expect-error `href` is not a div prop, so it is rejected without `elementType`.
	acceptsBoxProps({ href: '/account' });

	// @ts-expect-error `elementType` and `render` are mutually exclusive.
	acceptsAnchorBoxProps({ elementType: 'a', href: '/account', render: boxProps.render });
});
