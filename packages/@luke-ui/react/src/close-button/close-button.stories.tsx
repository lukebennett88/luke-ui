import type { CloseButtonProps } from '@luke-ui/react/close-button';
import { CloseButton } from '@luke-ui/react/close-button';
import { expect } from 'storybook/test';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: CloseButton,
	tags: ['actions'],
	title: 'Actions/CloseButton',
});

const sizes: Array<NonNullable<CloseButtonProps['size']>> = ['small', 'medium'];

const flexWrapStyle = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: '1rem',
} as const;

export const Default = meta.story({
	play: async ({ canvas }) => {
		await expect(canvas.getByRole('button', { name: 'Close' })).toBeInTheDocument();
	},
});

export const Sizes = meta.story({
	render: (props) => (
		<div style={flexWrapStyle}>
			{sizes.map((size) => (
				<CloseButton key={size} size={size} {...props} />
			))}
		</div>
	),
});

export const Disabled = meta.story({
	args: {
		isDisabled: true,
	},
	render: (props) => (
		<div style={flexWrapStyle}>
			{sizes.map((size) => (
				<CloseButton key={size} size={size} {...props} />
			))}
		</div>
	),
});
