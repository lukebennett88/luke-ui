import type { IconButtonProps } from '@luke-ui/react/icon-button';
import { IconButton } from '@luke-ui/react/icon-button';
import type { CSSProperties } from 'react';
import { fn } from 'storybook/test';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: IconButton,
	tags: ['actions'],
	title: 'Actions/IconButton',
});

const baseArgs = {
	icon: 'add',
	size: 'medium',
} satisfies Partial<IconButtonProps>;

const sizes: Array<NonNullable<IconButtonProps['size']>> = ['small', 'medium'];
const flexWrapStyle = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: '1rem',
} as const satisfies CSSProperties;

export const Default = meta.story({
	args: { ...baseArgs, 'aria-label': 'Add' },
});

export const Prominence = meta.story({
	args: { ...baseArgs, 'aria-label': 'Action' },
	render: (props) => (
		<div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(3, max-content)' }}>
			<IconButton {...props} aria-label="Low" prominence="low" />
			<IconButton {...props} aria-label="Standard" />
			<IconButton {...props} aria-label="High accent" prominence="high" tone="accent" />
		</div>
	),
});

export const Sizes = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={flexWrapStyle}>
			{sizes.map((size) => (
				<IconButton {...props} aria-label={size} key={size} size={size} />
			))}
		</div>
	),
});

export const Disabled = meta.story({
	args: {
		...baseArgs,
		isDisabled: true,
	},
	render: (props) => (
		<div style={flexWrapStyle}>
			{sizes.map((size) => (
				<IconButton {...props} aria-label={size} key={size} size={size} />
			))}
		</div>
	),
});

export const States = meta.story({
	args: {
		...baseArgs,
		'aria-label': 'Action',
		onPress: fn(),
	},
	render: (props) => (
		<div style={flexWrapStyle}>
			<IconButton {...props} aria-label="Default" />
			<IconButton {...props} aria-label="Disabled" isDisabled />
			<IconButton {...props} aria-label="Pending" isPending />
		</div>
	),
});
