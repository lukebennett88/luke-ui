import { Strong } from '@luke-ui/react/strong';
import { Text } from '@luke-ui/react/text';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: Strong,
	tags: ['typography'],
	title: 'Typography/Strong',
});

export const Default = meta.story({
	args: {
		children: 'The quick brown fox jumps over the lazy dog.',
	},
});

export const InContext = meta.story({
	render: () => (
		<Text>
			This is <Strong>very important</Strong> text within a paragraph.
		</Text>
	),
});

export const TextStyles = meta.story({
	render: () => (
		<Strong data-testid="styled" lineClamp={2} textWrap="balance">
			Strongly important text that is long enough to wrap across multiple lines.
		</Strong>
	),
});
