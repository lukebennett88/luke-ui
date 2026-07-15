import { expectTypeOf, test } from 'vite-plus/test';
import type { ButtonProps as PrimitiveButtonProps } from '../button/primitive/index.js';
import type { LinkProps } from '../link/index.js';
import type { TextProps } from '../text/index.js';
import type { DistributiveOmit } from './distributive-omit.js';

type ExampleUnion =
	| { kind: 'button'; onPress: () => void; slot?: string }
	| { href: string; kind: 'link'; slot?: string };

const buttonProps = {
	children: ({ isPending }) => (isPending ? 'Saving' : 'Save'),
	className: ({ isPressed }) => (isPressed ? 'pressed' : 'resting'),
	onPress: (event) => event.continuePropagation(),
} satisfies PrimitiveButtonProps;

const linkProps = {
	children: 'Account',
	className: ({ isHovered }) => (isHovered ? 'hovered' : 'resting'),
	href: '/account',
} satisfies LinkProps;

const textProps = {
	children: 'Account summary',
	elementType: 'span',
	id: 'account-summary-label',
	onClick: () => undefined,
} satisfies TextProps;

// Type assertions are compile-time only.
// oxlint-disable-next-line vitest/expect-expect
test('preserves React Aria render props and native DOM props', () => {
	expectTypeOf(buttonProps).toExtend<PrimitiveButtonProps>();
	expectTypeOf(linkProps).toExtend<LinkProps>();
	expectTypeOf(textProps).toExtend<TextProps>();
});

// Type assertions are compile-time only.
// oxlint-disable-next-line vitest/expect-expect
test('distributes over unions and rejects unknown omit keys', () => {
	expectTypeOf<DistributiveOmit<ExampleUnion, 'slot'>>().toEqualTypeOf<
		{ kind: 'button'; onPress: () => void } | { href: string; kind: 'link' }
	>();

	// @ts-expect-error Unknown keys must not silently pass through DistributiveOmit.
	expectTypeOf<DistributiveOmit<ExampleUnion, 'missing'>>();
});
