import type { LinkProps } from '@luke-ui/react/link';
import { Link } from '@luke-ui/react/link';
import type { CSSProperties } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
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
 * anchor behavior.
 */
export const Default = meta.story({
	args: baseArgs,
	play: async ({ canvas }) => {
		const link = canvas.getByRole('link', { name: 'Link' });
		await userEvent.tab();
		await expect(link).toHaveFocus();
		await expect(getComputedStyle(link).outlineStyle).toBe('solid');
		await expect(getComputedStyle(link).outlineWidth).toBe('2px');
		await expect(getComputedStyle(link).outlineOffset).toBe('2px');
	},
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
	play: async ({ canvas, step }) => {
		const standalone = canvas.getByRole('link', { name: 'Standalone link' });
		const inline = canvas.getByRole('link', { name: 'inline link' });

		await step('standalone links provide the structural target', async () => {
			await expect(getComputedStyle(standalone).minBlockSize).toBe('24px');
			await expect(getComputedStyle(standalone).minInlineSize).toBe('24px');
		});

		await step('inline links retain the prose target-size exception', async () => {
			await expect(getComputedStyle(inline).minBlockSize).toBe('0px');
			await expect(getComputedStyle(inline).minInlineSize).toBe('0px');
		});
	},
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
	play: async ({ args, canvas }) => {
		const link = canvas.getByRole('link', { name: 'Link' });
		const restingColor = getComputedStyle(link).color;

		await userEvent.hover(link);
		await userEvent.click(link);

		await expect(getComputedStyle(link).color).toBe(restingColor);
		await expect(args.onPress).not.toHaveBeenCalled();
	},
});
