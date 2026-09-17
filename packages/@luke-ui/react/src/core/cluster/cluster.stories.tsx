import type { ClusterProps } from '@luke-ui/react/cluster';
import { Cluster } from '@luke-ui/react/cluster';
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
	component: Cluster,
	tags: ['layout'],
	title: 'Layout/Cluster',
});

/** Cluster children on the inline axis with wrapping and a required gap. */
export const Default = meta.story({
	args: {
		children: (
			<>
				<span style={itemStyle}>Alpha</span>
				<span style={itemStyle}>Bravo</span>
				<span style={itemStyle}>Charlie</span>
				<span style={itemStyle}>Delta</span>
			</>
		),
		gap: 'sp8',
		style: { inlineSize: '14rem' },
	} satisfies Partial<ClusterProps>,
});

export const SpaceBetween = meta.story({
	args: {
		children: (
			<>
				<span style={itemStyle}>Start</span>
				<span style={itemStyle}>End</span>
			</>
		),
		gap: 'sp8',
		justifyContent: 'space-between',
	} satisfies Partial<ClusterProps>,
});

export const CustomRoot = meta.story({
	args: {
		children: (
			<>
				<span style={itemStyle}>First item</span>
				<span style={itemStyle}>Second item</span>
			</>
		),
		gap: 'sp8',
		render: (resolvedProps) => <MotionNav {...resolvedProps} />,
	} satisfies Partial<ClusterProps>,
});

function MotionNav(props: ComponentPropsWithRef<'nav'>) {
	return <nav data-motion="enabled" {...props} />;
}
