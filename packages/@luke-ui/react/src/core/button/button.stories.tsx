import type { ButtonProps } from '@luke-ui/react/button';
import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Kbd } from '@luke-ui/react/kbd';
import type { CSSProperties } from 'react';
import { fn } from 'storybook/test';
import preview from '../../../.storybook/preview.js';
import { vars } from '../../theme/index.js';

const meta = preview.meta({
	component: Button,
	tags: ['actions'],
	title: 'Actions/Button',
});

const baseArgs = {
	children: 'Button',
} satisfies Partial<ButtonProps>;

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
 * Tone communicates intent. Prominence controls visual emphasis.
 */
export const ToneAndAppearance = meta.story({
	args: baseArgs,
	render: ({ children }) => (
		<div style={stackStyle}>
			<div style={rowStyle}>
				<Button prominence="low">{children}</Button>
				<Button>{children}</Button>
				<Button tone="accent">{children}</Button>
				<Button prominence="high" tone="accent">
					{children}
				</Button>
				<Button prominence="low" tone="critical">
					{children}
				</Button>
				<Button tone="critical">{children}</Button>
				<Button prominence="high" tone="critical">
					{children}
				</Button>
			</div>
		</div>
	),
});

/**
 * Choose `small` for compact layouts. Choose `medium` for a standard touch target and spacing.
 */
export const Size = meta.story({
	args: baseArgs,
	render: () => (
		<div style={rowStyle}>
			{sizes.map((size) => (
				<Button key={size} size={size}>
					{size}
				</Button>
			))}
		</div>
	),
});

export const Block = meta.story({
	args: {
		...baseArgs,
		children: 'Block button',
		isBlock: true,
	} satisfies Partial<ButtonProps>,
	render: ({ children, isBlock }) => (
		<div style={blockContainerStyle}>
			<div>
				<Button isBlock={isBlock}>{children}</Button>
			</div>
			<div>
				<Button isBlock={false}>Non-block button</Button>
			</div>
		</div>
	),
});

/**
 * Place non-interactive adornments before or after text. For icon-only buttons, use `IconButton`.
 */
export const ContentSlots = meta.story({
	render: () => (
		<div style={stackStyle}>
			<div style={rowStyle}>
				<Button startContent={<Icon name="add" />}>Add item</Button>
				<Button endContent={<Kbd>⌘S</Kbd>}>Save</Button>
			</div>
		</div>
	),
});

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
});

export const Disabled = meta.story({
	args: {
		...baseArgs,
		isDisabled: true,
	},
	render: ({ isDisabled }) => (
		<div style={rowStyle}>
			<Button isDisabled={isDisabled}>Neutral</Button>
			<Button isDisabled={isDisabled} tone="accent">
				Accent
			</Button>
			<Button isDisabled={isDisabled} tone="critical">
				Critical
			</Button>
		</div>
	),
});

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
