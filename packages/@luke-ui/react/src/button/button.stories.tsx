import type { ButtonProps } from '@luke-ui/react/button';
import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import type { CSSProperties } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import preview from '../../.storybook/preview.js';
import { vars } from '../theme/index.js';

const meta = preview.meta({
	component: Button,
	tags: ['actions'],
	title: 'Actions/Button',
});

const baseArgs = {
	children: 'Button',
} satisfies Partial<ButtonProps>;

const tones: Array<NonNullable<ButtonProps['tone']>> = ['neutral', 'accent', 'danger'];
const appearances: Array<NonNullable<ButtonProps['appearance']>> = ['solid', 'subtle', 'ghost'];

const sizes: Array<NonNullable<ButtonProps['size']>> = ['small', 'medium'];

const rowStyle = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: '1rem',
} as const satisfies CSSProperties;

const stackStyle = {
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
} as const satisfies CSSProperties;

const blockContainerStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
	inlineSize: '100%',
	maxInlineSize: '24rem',
} as const satisfies CSSProperties;

const truncationContainerStyle = {
	borderColor: vars.color.border.decorative,
	borderStyle: 'dashed',
	borderWidth: 1,
	inlineSize: '100%',
	maxInlineSize: '20rem',
	minInlineSize: 0,
	padding: '1rem',
} as const satisfies CSSProperties;

/**
 * Tone communicates intent. Appearance controls the action's visual emphasis.
 */
export const ToneAndAppearance = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={stackStyle}>
			{tones.map((tone) => (
				<div key={tone} style={rowStyle}>
					{appearances.map((appearance) => (
						<Button appearance={appearance} key={appearance} tone={tone} {...props}>
							{tone} {appearance}
						</Button>
					))}
				</div>
			))}
		</div>
	),
});

/**
 * Button size controls touch target and spacing. `small` is compact and
 * `medium` is the default size.
 */
export const Size = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={rowStyle}>
			{sizes.map((size) => (
				<Button key={size} size={size} {...props}>
					{size}
				</Button>
			))}
		</div>
	),
});

/**
 * `isBlock` expands a button to fill the parent container's inline size.
 * Compare it against the default intrinsic button width.
 */
export const Block = meta.story({
	args: {
		...baseArgs,
		children: 'Block button',
		isBlock: true,
	} satisfies Partial<ButtonProps>,
	render: (props) => (
		<div style={blockContainerStyle}>
			<div>
				<Button {...props} />
			</div>
			<div>
				<Button {...props} isBlock={false}>
					Non-block button
				</Button>
			</div>
		</div>
	),
});

/**
 * Place icons before or after text. For icon-only buttons, use `IconButton`.
 */
export const IconContent = meta.story({
	render: (props) => (
		<div style={stackStyle}>
			<div style={rowStyle}>
				<Button {...props} startIcon={<Icon name="add" />}>
					Start icon
				</Button>
				<Button {...props} endIcon={<Icon name="add" />}>
					End icon
				</Button>
			</div>
		</div>
	),
});

/**
 * Hover and pressed states are interactive in canvas, while disabled and
 * pending states are rendered directly.
 */
export const States = meta.story({
	args: {
		...baseArgs,
		onPress: fn(),
	},
	render: (props) => (
		<div style={rowStyle}>
			<Button {...props}>Default</Button>
			<Button {...props} isDisabled>
				Disabled
			</Button>
			<Button {...props} isPending>
				Pending
			</Button>
		</div>
	),
	play: async ({ args, canvas, step }) => {
		const pending = canvas.getByRole('button', { name: 'Pending' });
		const disabled = canvas.getByRole('button', { name: 'Disabled' });
		const busyCue = canvas.getByRole('progressbar', { hidden: true });

		await step('pending remains focusable, busy, and non-interactive', async () => {
			await userEvent.tab();
			await userEvent.tab();
			await expect(pending).toHaveFocus();
			await expect(pending).toHaveAttribute('aria-disabled', 'true');
			await expect(getComputedStyle(busyCue).color).toBe(getComputedStyle(pending).outlineColor);
			await userEvent.click(pending);
			await expect(args.onPress).not.toHaveBeenCalled();
		});

		await step('pending uses the disabled visual treatment', async () => {
			await expect(getComputedStyle(pending).opacity).toBe('0.55');
			await expect(getComputedStyle(pending).boxShadow).toBe(getComputedStyle(disabled).boxShadow);
		});
	},
});

/**
 * Disabled buttons communicate that an action is temporarily unavailable.
 */
export const Disabled = meta.story({
	args: {
		...baseArgs,
		isDisabled: true,
	},
	render: (props) => (
		<div style={rowStyle}>
			{tones.map((tone) => (
				<Button key={tone} tone={tone} {...props}>
					{tone}
				</Button>
			))}
		</div>
	),
});

/**
 * Long labels truncate with an ellipsis when space is constrained.
 */
export const Truncation = meta.story({
	args: {
		children:
			'This a really really really really long string of text that should truncate instead of wrapping',
		isBlock: true,
	},
	render: (props) => (
		<div style={truncationContainerStyle}>
			<Button {...props} />
		</div>
	),
	play: async ({ canvas }) => {
		const label = canvas.getByText(
			'This a really really really really long string of text that should truncate instead of wrapping',
		);

		await expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
		await expect(getComputedStyle(label).whiteSpace).toBe('nowrap');
		await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
	},
});
