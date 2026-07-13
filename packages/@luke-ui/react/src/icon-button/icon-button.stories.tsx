import { iconNames } from '@luke-ui/react/icon';
import type { IconButtonProps } from '@luke-ui/react/icon-button';
import { IconButton } from '@luke-ui/react/icon-button';
import type { CSSProperties } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
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
		const icon = button.getElementsByTagName('svg').item(0);
		if (!icon) throw new Error('IconButton did not render an icon');

		const buttonBounds = button.getBoundingClientRect();
		const iconBounds = icon.getBoundingClientRect();

		await expect(button).toBeInTheDocument();
		await expect(getComputedStyle(button).blockSize).toBe('40px');
		await expect(getComputedStyle(button).inlineSize).toBe('40px');
		await expect(iconBounds.x + iconBounds.width / 2).toBeCloseTo(
			buttonBounds.x + buttonBounds.width / 2,
		);
		await expect(iconBounds.y + iconBounds.height / 2).toBeCloseTo(
			buttonBounds.y + buttonBounds.height / 2,
		);
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
	play: async ({ args, canvas, step }) => {
		const disabled = canvas.getByRole('button', { name: 'Disabled' });
		const pending = canvas.getByRole('button', { name: 'Pending' });

		await step('pending remains focusable, busy, and non-interactive', async () => {
			await userEvent.tab();
			await userEvent.tab();
			await expect(pending).toHaveFocus();
			await expect(pending).toHaveAttribute('aria-disabled', 'true');
			await userEvent.click(pending);
			await expect(args.onPress).not.toHaveBeenCalled();
		});

		await step('pending uses the disabled visual treatment', async () => {
			await expect(getComputedStyle(pending).opacity).toBe('0.55');
			await expect(getComputedStyle(pending).boxShadow).toBe(getComputedStyle(disabled).boxShadow);
		});
	},
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
