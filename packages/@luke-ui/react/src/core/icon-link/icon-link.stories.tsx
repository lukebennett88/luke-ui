import type { IconLinkProps } from '@luke-ui/react/icon-link';
import { IconLink } from '@luke-ui/react/icon-link';
import type { CSSProperties } from 'react';
import { fn } from 'storybook/test';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: IconLink,
	tags: ['actions'],
	title: 'Actions/IconLink',
});

const baseArgs = {
	'aria-label': 'Search',
	href: '#',
	icon: 'search',
	size: 'medium',
} satisfies Partial<IconLinkProps>;

const sizes: Array<NonNullable<IconLinkProps['size']>> = ['small', 'medium'];
const flexWrapStyle = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: '1rem',
} as const satisfies CSSProperties;

export const Default = meta.story({
	args: baseArgs,
});

export const Prominence = meta.story({
	args: { ...baseArgs, 'aria-label': 'Open documentation', icon: 'bookOpen' },
	render: ({ href, icon }) => (
		<div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(3, max-content)' }}>
			<IconLink aria-label="Low" href={href} icon={icon} prominence="low" />
			<IconLink aria-label="Standard" href={href} icon={icon} />
			<IconLink aria-label="High prominence" href={href} icon={icon} prominence="high" />
		</div>
	),
});

export const Sizes = meta.story({
	args: baseArgs,
	render: ({ href, icon }) => (
		<div style={flexWrapStyle}>
			{sizes.map((size) => (
				<IconLink aria-label={size} href={href} icon={icon} key={size} size={size} />
			))}
		</div>
	),
});

export const Disabled = meta.story({
	args: {
		...baseArgs,
		isDisabled: true,
	},
	render: ({ href, icon }) => (
		<div style={flexWrapStyle}>
			{sizes.map((size) => (
				<IconLink aria-label={size} href={href} icon={icon} isDisabled key={size} size={size} />
			))}
		</div>
	),
});

export const States = meta.story({
	args: {
		...baseArgs,
		onPress: fn(),
	},
	render: ({ href, icon, onPress }) => (
		<div style={flexWrapStyle}>
			<IconLink aria-label="Default" href={href} icon={icon} onPress={onPress} />
			<IconLink aria-label="Disabled" href={href} icon={icon} isDisabled onPress={onPress} />
		</div>
	),
});
