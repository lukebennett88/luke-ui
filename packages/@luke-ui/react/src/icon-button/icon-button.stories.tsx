import { iconNames } from '@luke-ui/react/icon';
import type { IconButtonProps } from '@luke-ui/react/icon-button';
import { IconButton } from '@luke-ui/react/icon-button';
import type { CSSProperties } from 'react';
import { expect, userEvent } from 'storybook/test';
import preview from '../../.storybook/preview.js';

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
const tones: Array<NonNullable<IconButtonProps['tone']>> = ['neutral', 'accent', 'danger'];
const variants: Array<NonNullable<IconButtonProps['variant']>> = ['solid', 'subtle', 'ghost'];

const flexWrapStyle = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: '1rem',
} as const satisfies CSSProperties;

export const Default = meta.story({
	args: { ...baseArgs, 'aria-label': 'Add' },
	play: async ({ canvas }) => {
		const button = canvas.getByRole('button', { name: 'Add' });
		await expect(button).toBeInTheDocument();
		await expect(getComputedStyle(button).blockSize).toBe('40px');
		await expect(getComputedStyle(button).inlineSize).toBe('40px');
		await userEvent.tab();
		await expect(button).toHaveFocus();
	},
});

export const Appearance = meta.story({
	args: { ...baseArgs, 'aria-label': 'Action' },
	render: (props) => (
		<div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(3, max-content)' }}>
			{tones.flatMap((tone) => {
				return variants.map((variant) => (
					<IconButton
						{...props}
						aria-label={`${tone} ${variant}`}
						key={`${tone}-${variant}`}
						tone={tone}
						variant={variant}
					/>
				));
			})}
		</div>
	),
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
				<IconButton {...props} icon={iconName} key={iconName} />
			))}
		</div>
	),
});
