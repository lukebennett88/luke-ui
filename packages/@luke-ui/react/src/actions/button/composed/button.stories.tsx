import type { ButtonProps } from '@luke-ui/react/actions/composed';
import { Button } from '@luke-ui/react/actions/composed';
import { vars } from '@luke-ui/react/theme';
import { Icon } from '@luke-ui/react/visuals';
import type { CSSProperties } from 'react';
import { expect } from 'storybook/test';
import preview from '../../../../.storybook/preview.js';

const meta = preview.meta({
	component: Button,
	title: 'Actions/Button',
});

const baseArgs = {
	children: 'Button',
} satisfies Partial<ButtonProps>;

const tones: Array<NonNullable<ButtonProps['tone']>> = [
	'primary',
	'critical',
	'ghost',
	'neutral',
];

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
	borderColor: vars.border.default,
	borderStyle: 'dashed',
	borderWidth: 1,
	inlineSize: '100%',
	maxInlineSize: '20rem',
	minInlineSize: 0,
	padding: '1rem',
} as const satisfies CSSProperties;

/**
 * Button tone communicates emphasis. Use `primary` for default actions and
 * `critical`, `ghost`, or `neutral` for alternate intent.
 */
export const Tone = meta.story({
	args: baseArgs,
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole('button', { name: 'primary' }),
		).toBeInTheDocument();
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
				<Button {...props}>
					<Icon name="add" />
					Start icon
				</Button>
				<Button {...props}>
					End icon
					<Icon name="add" />
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
	args: baseArgs,
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
});
