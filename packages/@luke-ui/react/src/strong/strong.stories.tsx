import { Strong } from '@luke-ui/react/strong';
import { Text } from '@luke-ui/react/text';
import { expect } from 'storybook/test';
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
	play: async ({ canvas, canvasElement }) => {
		const element = canvas.getByText('very important');
		const style = getComputedStyle(element);
		const emphasisWeight = getComputedStyle(canvasElement)
			.getPropertyValue('--luke-font-weight-emphasis')
			.trim();
		await expect(style.display).toBe('inline');
		await expect(style.fontWeight).toBe(emphasisWeight);
		await expect(getComputedStyle(element, '::before').content).toBe('none');
		await expect(getComputedStyle(element, '::before').display).not.toBe('table');
		await expect(getComputedStyle(element, '::after').content).toBe('none');
		await expect(getComputedStyle(element, '::after').display).not.toBe('table');
	},
	render: () => (
		<Text>
			This is <Strong>very important</Strong> text within a paragraph.
		</Text>
	),
});

export const TextStyles = meta.story({
	play: async ({ canvas }) => {
		const style = getComputedStyle(canvas.getByTestId('styled'));
		await expect(style.display).toBe('flow-root');
		await expect(style.textWrap).toBe('balance');
		await expect(style.webkitLineClamp).toBe('2');
	},
	render: () => (
		<Strong data-testid="styled" lineClamp={2} textWrap="balance">
			Strongly important text that is long enough to wrap across multiple lines.
		</Strong>
	),
});
