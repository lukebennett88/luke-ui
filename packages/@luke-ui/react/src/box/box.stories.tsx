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
		flexDirection: { initial: 'column', medium: 'row' },
		gap: { initial: '200', medium: '600' },
		padding: { initial: '300', medium: '600' },
		style: { backgroundColor: vars.color.surface.recessed },
	} satisfies Partial<BoxProps>,
});

export const CustomDiv = meta.story({
	args: {
		'aria-label': 'Account summary',
		children: 'Account summary content',
		className: 'consumer-class',
		id: 'account-summary',
		padding: '400',
		render: (domProps) => <MotionDiv {...domProps} />,
		style: { backgroundColor: vars.color.surface.recessed },
	} satisfies Partial<BoxProps>,
});

function MotionDiv(props: ComponentPropsWithRef<'div'>) {
	return <div data-motion="enabled" {...props} />;
}
