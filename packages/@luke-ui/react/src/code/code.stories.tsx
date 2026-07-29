import { Code } from '@luke-ui/react/code';
import { Text } from '@luke-ui/react/text';
import { expect } from 'storybook/test';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: Code,
	tags: ['typography'],
	title: 'Typography/Code',
});

export const Default = meta.story({
	args: {
		children: 'console.log("hello world")',
	},
	play: async ({ canvas, canvasElement }) => {
		const code = getComputedStyle(canvas.getByText(/console\.log/)).fontFamily;
		const codeToken = getComputedStyle(canvasElement)
			.getPropertyValue('--luke-font-family-code')
			.trim();
		await expect(code.replaceAll(/['"]/g, '')).toBe(codeToken.replaceAll(/['"]/g, ''));
	},
});

export const InContext = meta.story({
	render: () => (
		<Text>
			Use the <Code>useTheme</Code> hook to access the current theme.
		</Text>
	),
});
