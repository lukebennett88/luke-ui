import type { StackProps } from '@luke-ui/react/stack';
import { Stack } from '@luke-ui/react/stack';
import { vars } from '@luke-ui/react/theme';
import type { ComponentPropsWithRef } from 'react';
import preview from '../../../.storybook/preview.js';

const itemStyle = {
	backgroundColor: vars.color.surface.floating,
	borderRadius: vars.radius.detail,
	paddingBlock: vars.space.sp8,
	paddingInline: vars.space.sp12,
} as const;

const meta = preview.meta({
	component: Stack,
	tags: ['layout'],
	title: 'Layout/Stack',
});

/** Stack children on the block axis. */
export const Default = meta.story({
	args: {
		children: (
			<>
				<span style={itemStyle}>First</span>
				<span style={itemStyle}>Second</span>
				<span style={itemStyle}>Third</span>
			</>
		),
		gap: 'sp12',
	} satisfies Partial<StackProps>,
});

export const Section = meta.story({
	args: {
		'aria-label': 'Stack example',
		children: (
			<>
				<span style={itemStyle}>First item</span>
				<span style={itemStyle}>Second item</span>
			</>
		),
		elementType: 'section',
		gap: 'sp8',
	} satisfies Partial<StackProps>,
});

export const CustomRoot = meta.story({
	args: {
		children: (
			<>
				<span style={itemStyle}>First</span>
				<span style={itemStyle}>Second</span>
			</>
		),
		gap: 'sp8',
		render: (resolvedProps) => <MotionDiv {...resolvedProps} />,
	} satisfies Partial<StackProps>,
});

function MotionDiv(props: ComponentPropsWithRef<'div'>) {
	return <div data-motion="enabled" {...props} />;
}
