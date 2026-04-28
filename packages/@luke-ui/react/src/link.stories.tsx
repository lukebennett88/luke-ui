import type { LinkProps } from '@luke-ui/react/link';
import { Link } from '@luke-ui/react/link';
import type { CSSProperties } from 'react';
import { expect } from 'storybook/test';
import preview from '../.storybook/preview.js';

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

const darkPanelStyle = {
	backgroundColor: 'oklch(0.2 0 0)',
	paddingBlock: '0.125rem',
	paddingInline: '0.25rem',
} as const satisfies CSSProperties;

/**
 * Use `Link` for navigation and external destinations while preserving native
 * anchor behavior.
 */
export const Default = meta.story({
	args: baseArgs,
	play: async ({ canvas }) => {
		await expect(canvas.getByRole('link', { name: 'Link' })).toBeInTheDocument();
	},
});

/**
 * Link tone controls contrast against surrounding UI. Use `neutral` for
 * reduced emphasis and `inverted` on dark surfaces.
 */
export const Tone = meta.story({
	args: {
		...baseArgs,
		children: 'Brand (default)',
	} satisfies Partial<LinkProps>,
	render: (props) => (
		<div style={stackStyle}>
			<Link {...props} tone="brand" />
			<Link {...props} tone="neutral">
				Neutral
			</Link>
			<div style={darkPanelStyle}>
				<Link {...props} tone="inverted">
					Inverted
				</Link>
			</div>
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
