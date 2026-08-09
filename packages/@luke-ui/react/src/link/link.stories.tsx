import type { LinkProps } from '@luke-ui/react/link';
import { Link } from '@luke-ui/react/link';
import type { CSSProperties } from 'react';
import { fn } from 'storybook/test';
import preview from '../../.storybook/preview.js';

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
 * Use the default `accent` tone for emphasis or `neutral` when the surrounding
 * content should lead.
 */
export const Tone = meta.story({
	args: {
		...baseArgs,
		children: 'Accent (default)',
	} satisfies Partial<LinkProps>,
	render: (props) => (
		<div style={stackStyle}>
			<Link {...props} />
			<Link {...props} tone="neutral">
				Neutral
			</Link>
		</div>
	),
});

/**
 * Standalone links are best when presented as a separate action. Inline links
 * remain underlined within sentence flow.
 */
export const Standalone = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={stackStyle}>
			<p>When the link is separated from a sentence, use standalone style.</p>
			<Link {...props} isStandalone>
				Standalone link
			</Link>
			<p>
				When part of a sentence, use the default <Link {...props}>inline link</Link> style.
			</p>
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
