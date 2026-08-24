import type { BoxProps } from '@luke-ui/react/box';
import { Box } from '@luke-ui/react/box';
import { vars } from '@luke-ui/react/theme';
import type { ComponentPropsWithRef } from 'react';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: Box,
	tags: ['layout'],
	title: 'Layout/Box',
});

/** Use Box for responsive layout without attaching layout props to semantic components. */
export const Default = meta.story({
	args: {
		children: (
			<>
				<span>First item</span>
				<span>Second item</span>
			</>
		),
		display: 'flex',
		flexDirection: { initial: 'column', bp768: 'row' },
		gap: { initial: 'sp8', bp768: 'sp24' },
		padding: { initial: 'sp12', bp768: 'sp24' },
		style: { backgroundColor: vars.color.surface.recessed },
	} satisfies Partial<BoxProps>,
});

export const Section = meta.story({
	args: {
		'aria-label': 'Account summary',
		children: 'Account summary content',
		display: 'flex',
		elementType: 'section',
		padding: 'sp16',
		style: { backgroundColor: vars.color.surface.recessed },
	} satisfies Partial<BoxProps>,
});

export const CustomDiv = meta.story({
	args: {
		children: 'Account summary content',
		className: 'consumer-class',
		padding: 'sp16',
		ref: (element) => element?.setAttribute('data-box-ref', 'received'),
		render: (resolvedProps) => (
			<MotionDiv aria-label="Account summary" id="account-summary" {...resolvedProps} />
		),
		style: { backgroundColor: vars.color.surface.recessed },
	} satisfies Partial<BoxProps>,
});

function MotionDiv(props: ComponentPropsWithRef<'div'>) {
	return <div data-motion="enabled" {...props} />;
}
