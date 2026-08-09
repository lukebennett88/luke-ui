import { Code } from '@luke-ui/react/code';
import { Text } from '@luke-ui/react/text';
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
});

export const InContext = meta.story({
	render: () => (
		<Text>
			Use the <Code>useTheme</Code> hook to access the current theme.
		</Text>
	),
});
