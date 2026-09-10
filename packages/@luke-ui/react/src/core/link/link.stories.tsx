import type { LinkProps } from '@luke-ui/react/link';
import { Link } from '@luke-ui/react/link';
import type { CSSProperties } from 'react';
import { fn } from 'storybook/test';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: Link,
	tags: ['actions'],
	title: 'Actions/Link',
});

const baseArgs = {
	children: 'Link',
	href: '#',
} satisfies Partial<LinkProps>;

const stackStyle = {
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'column',
	gap: '1.5rem',
	maxInlineSize: '40rem',
} as const satisfies CSSProperties;

/**
 * Use `Link` for navigation and external destinations while preserving native
 * anchor behaviour.
 */
export const Default = meta.story({
	args: baseArgs,
});

/**
 * Use high prominence for a primary destination. Use low prominence for quiet navigation.
 */
export const Tone = meta.story({
	args: {
		...baseArgs,
		children: 'Neutral (default)',
	} satisfies Partial<LinkProps>,
	render: ({ href, onPress }) => (
		<div style={stackStyle}>
			<Link href={href} onPress={onPress}>
				Neutral (default)
			</Link>
			<Link href={href} onPress={onPress} prominence="high">
				Accent
			</Link>
		</div>
	),
});

/**
 * A button-shaped Link remains navigation and keeps link semantics.
 */
export const Appearance = meta.story({
	args: baseArgs,
	render: ({ href, onPress }) => (
		<div style={stackStyle}>
			<Link href={href} onPress={onPress} prominence="low">
				Low prominence Link
			</Link>
			<Link appearance="button" href={href} onPress={onPress} prominence="high">
				Button-shaped Link
			</Link>
		</div>
	),
});

/**
 * Disabled links remain visible but cannot navigate or respond to interaction.
 */
export const Disabled = meta.story({
	args: {
		...baseArgs,
		isDisabled: true,
		onPress: fn(),
	},
});
