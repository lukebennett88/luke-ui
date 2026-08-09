import { Em } from '@luke-ui/react/em';
import { Text } from '@luke-ui/react/text';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: Em,
	tags: ['typography'],
	title: 'Typography/Em',
});

export const Default = meta.story({
	args: {
		children: 'The quick brown fox jumps over the lazy dog.',
	},
});

export const InContext = meta.story({
	render: () => (
		<Text>
			This is <Em>emphasised</Em> text within a paragraph.
		</Text>
	),
});

export const TextStyles = meta.story({
	render: () => (
		<Em data-testid="styled" lineClamp={2} textWrap="balance">
			Emphasised text that is long enough to wrap across multiple lines.
		</Em>
	),
});
