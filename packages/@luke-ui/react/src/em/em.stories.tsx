import { Em } from '@luke-ui/react/em';
import { Text } from '@luke-ui/react/text';
import { expect } from 'storybook/test';
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
	play: async ({ canvas }) => {
		const element = canvas.getByText('emphasised');
		const style = getComputedStyle(element);
		await expect(style.display).toBe('inline');
		await expect(style.fontStyle).toBe('italic');
		await expect(getComputedStyle(element, '::before').content).toBe('none');
		await expect(getComputedStyle(element, '::before').display).not.toBe('table');
		await expect(getComputedStyle(element, '::after').content).toBe('none');
		await expect(getComputedStyle(element, '::after').display).not.toBe('table');
	},
	render: () => (
		<Text>
			This is <Em>emphasised</Em> text within a paragraph.
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
		<Em data-testid="styled" lineClamp={2} textWrap="balance">
			Emphasised text that is long enough to wrap across multiple lines.
		</Em>
	),
});
