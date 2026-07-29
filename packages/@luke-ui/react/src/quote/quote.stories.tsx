import { Quote } from '@luke-ui/react/quote';
import { Text } from '@luke-ui/react/text';
import { expect } from 'storybook/test';
import preview from '../../.storybook/preview.js';

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
	play: async ({ canvas }) => {
		const element = canvas.getByText('I will be back');
		await expect(getComputedStyle(element).display).toBe('inline');
		await expect(getComputedStyle(element, '::before').display).not.toBe('table');
		await expect(getComputedStyle(element, '::after').display).not.toBe('table');
	},
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
	play: async ({ canvas }) => {
		const style = getComputedStyle(canvas.getByTestId('styled'));
		await expect(style.display).toBe('flow-root');
		await expect(style.textWrap).toBe('balance');
		await expect(style.webkitLineClamp).toBe('2');
	},
	render: () => (
		<Quote data-testid="styled" lineClamp={2} textWrap="balance">
			A short quotation that is long enough to wrap across multiple lines.
		</Quote>
	),
});
