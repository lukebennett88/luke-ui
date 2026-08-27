import { Quote } from '@luke-ui/react/quote';
import { Text } from '@luke-ui/react/text';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: Quote,
	tags: ['typography'],
	title: 'Typography/Quote',
});

export const Default = meta.story({
	args: {
		children: 'The quick brown fox jumps over the lazy dog.',
	},
});

export const InContext = meta.story({
	render: () => (
		<Text>
			He said <Quote>I will be back</Quote> and walked away.
		</Text>
	),
});

export const Cited = meta.story({
	args: {
		children: 'The only way to do great work is to love what you do.',
		cite: 'https://example.com/sources/steve-jobs',
	},
});

export const TextStyles = meta.story({
	render: () => (
		<Quote data-testid="styled" lineClamp={2} textWrap="balance">
			A short quotation that is long enough to wrap across multiple lines.
		</Quote>
	),
});
