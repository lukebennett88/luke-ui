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
	'aria-label': 'Add',
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
	args: baseArgs,
});

export const Prominence = meta.story({
	args: { ...baseArgs, 'aria-label': 'Action' },
	render: ({ icon }) => (
		<div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(3, max-content)' }}>
			<IconButton aria-label="Low" icon={icon} prominence="low" />
			<IconButton aria-label="Standard" icon={icon} />
			<IconButton aria-label="High accent" icon={icon} prominence="high" tone="accent" />
		</div>
	),
});

export const Sizes = meta.story({
	args: baseArgs,
	render: ({ icon }) => (
		<div style={flexWrapStyle}>
			{sizes.map((size) => (
				<IconButton aria-label={size} icon={icon} key={size} size={size} />
			))}
		</div>
	),
});

export const Disabled = meta.story({
	args: {
		...baseArgs,
		isDisabled: true,
	},
	render: ({ icon }) => (
		<div style={flexWrapStyle}>
			{sizes.map((size) => (
				<IconButton aria-label={size} icon={icon} isDisabled key={size} size={size} />
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
	render: ({ icon, onPress }) => (
		<div style={flexWrapStyle}>
			<IconButton aria-label="Default" icon={icon} onPress={onPress} />
			<IconButton aria-label="Disabled" icon={icon} isDisabled onPress={onPress} />
			<IconButton aria-label="Pending" icon={icon} isPending onPress={onPress} />
		</div>
	),
});
