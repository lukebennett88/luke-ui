import type { IconButtonProps } from '@luke-ui/react/actions/composed';
import { IconButton } from '@luke-ui/react/actions/composed';
import { iconNames } from '@luke-ui/react/visuals';
import type { CSSProperties } from 'react';
import { expect } from 'storybook/test';
import preview from '../../../../.storybook/preview.js';

const meta = preview.meta({
	component: IconButton,
	title: 'Actions/IconButton',
});

const baseArgs = {
	icon: 'add',
} satisfies Partial<IconButtonProps>;

const sizes: Array<NonNullable<IconButtonProps['size']>> = ['small', 'medium'];

const flexWrapStyle = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: '1rem',
} as const satisfies CSSProperties;

export const Default = meta.story({
	args: { ...baseArgs, 'aria-label': 'Add' },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole('button', { name: 'Add' }),
		).toBeInTheDocument();
	},
});

export const Sizes = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={flexWrapStyle}>
			{sizes.map((size) => (
				<IconButton key={size} size={size} {...props} />
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
				<IconButton key={size} size={size} {...props} />
			))}
		</div>
	),
});

export const AllIcons = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={flexWrapStyle}>
			{iconNames.map((iconName) => (
				<IconButton {...props} key={iconName} icon={iconName} />
			))}
		</div>
	),
});
