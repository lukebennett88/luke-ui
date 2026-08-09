import { Kbd } from '@luke-ui/react/kbd';
import { Text } from '@luke-ui/react/text';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: Kbd,
	tags: ['typography'],
	title: 'Typography/Kbd',
});

export const Default = meta.story({
	args: {
		children: '⌘K',
	},
});

export const InContext = meta.story({
	render: () => (
		<Text>
			Press <Kbd>⌘S</Kbd> to save.
		</Text>
	),
});

export const Hotkey = meta.story({
	render: () => (
		<Text>
			<Kbd>⇧⌘P</Kbd> opens the command palette.
		</Text>
	),
});
