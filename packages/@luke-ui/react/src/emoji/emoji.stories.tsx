import type { EmojiProps } from '@luke-ui/react/emoji';
import { Emoji } from '@luke-ui/react/emoji';
import { Text } from '@luke-ui/react/text';
import type { CSSProperties } from 'react';
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
 * Pass a label when an emoji conveys meaning.
 */
export const Default = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={rowStyle}>
			<Emoji {...props} />
			<Text>Release deployed successfully.</Text>
		</div>
	),
});

export const Size = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={stackStyle}>
			<Emoji {...props} emoji="🚀" label="Rocket" size="900" />
			<Emoji {...props} emoji="🚀" label="Rocket" size="600" />
			<Emoji {...props} emoji="🚀" label="Rocket" size="300" />
			<Emoji {...props} emoji="🚀" label="Rocket" size="100" />
		</div>
	),
});
