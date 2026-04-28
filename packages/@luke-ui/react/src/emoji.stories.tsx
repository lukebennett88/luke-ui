import type { EmojiProps } from '@luke-ui/react/emoji';
import { Emoji } from '@luke-ui/react/emoji';
import { Text } from '@luke-ui/react/text';
import type { CSSProperties } from 'react';
import { expect } from 'storybook/test';
import preview from '../.storybook/preview.js';

const meta = preview.meta({
	component: Emoji,
	tags: ['typography'],
	title: 'Typography/Emoji',
});

const rowStyle = {
	alignItems: 'center',
	display: 'flex',
	gap: '0.5rem',
} as const satisfies CSSProperties;

const stackStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
	maxInlineSize: '40rem',
} as const satisfies CSSProperties;

const baseArgs = {
	emoji: '🎉',
	label: 'Celebration',
} satisfies EmojiProps;

/**
 * `Emoji` renders decorative emoji with an accessible label.
 */
export const Default = meta.story({
	args: baseArgs,
	play: async ({ canvas }) => {
		await expect(canvas.getByRole('img', { name: 'Celebration' })).toBeInTheDocument();
	},
	render: (props) => (
		<div style={rowStyle}>
			<Emoji {...props} />
			<Text>Release deployed successfully.</Text>
		</div>
	),
});

/**
 * Emoji size follows text sizing so it scales consistently with typography.
 */
export const Size = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={stackStyle}>
			<Emoji {...props} emoji="🚀" fontSize="h3" label="Rocket" />
			<Emoji {...props} emoji="🚀" fontSize="h5" label="Rocket" />
			<Emoji {...props} emoji="🚀" fontSize="standard" label="Rocket" />
			<Emoji {...props} emoji="🚀" fontSize="small" label="Rocket" />
		</div>
	),
});
