import { Blockquote } from '@luke-ui/react/blockquote';
import { Text } from '@luke-ui/react/text';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: Blockquote,
	tags: ['typography'],
	title: 'Typography/Blockquote',
});

export const Default = meta.story({
	args: {
		children: 'The quick brown fox jumps over the lazy dog.',
	},
});

export const InContext = meta.story({
	render: () => (
		<Text>
			<Blockquote>The only way to do great work is to love what you do.</Blockquote>
		</Text>
	),
});
