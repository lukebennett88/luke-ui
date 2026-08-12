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
		<Text>
			Release deployed successfully <Emoji {...props} />
		</Text>
	),
});

/**
 * Wrap `Emoji` in `Text` when it needs a specific typography treatment.
 */
export const Inheritance = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={stackStyle}>
			<Text typography="display">
				Hello <Emoji {...props} emoji="👋" label="Waving hand" />
			</Text>
			<Text typography="heading3">
				Hello <Emoji {...props} emoji="👋" label="Waving hand" />
			</Text>
			<Text typography="body">
				Hello <Emoji {...props} emoji="👋" label="Waving hand" />
			</Text>
			<Text typography="caption">
				Hello <Emoji {...props} emoji="👋" label="Waving hand" />
			</Text>
		</div>
	),
});
