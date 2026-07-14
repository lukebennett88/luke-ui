import type { EmojiProps } from '@luke-ui/react/emoji';
import { Emoji } from '@luke-ui/react/emoji';
import { Text } from '@luke-ui/react/text';
import type { CSSProperties } from 'react';
import { expect } from 'storybook/test';
import preview from '../../.storybook/preview.js';

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
		const emoji = canvas.getByRole('img', { name: 'Celebration' });
		await expect(emoji.textContent).toBe('🎉');
		await expect(getComputedStyle(emoji).fontSize).toBe('16px');
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
	play: async ({ canvas }) => {
		const rockets = canvas.getAllByRole('img', { name: 'Rocket' });
		await expect(rockets.map((emoji) => getComputedStyle(emoji).fontSize)).toEqual([
			'60px',
			'24px',
			'16px',
			'12px',
		]);
	},
	render: (props) => (
		<div style={stackStyle}>
			<Emoji {...props} emoji="🚀" label="Rocket" size={900} />
			<Emoji {...props} emoji="🚀" label="Rocket" size={600} />
			<Emoji {...props} emoji="🚀" label="Rocket" size={300} />
			<Emoji {...props} emoji="🚀" label="Rocket" size={100} />
		</div>
	),
});
