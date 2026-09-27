import { Emoji } from '@luke-ui/react/emoji';
import { Text } from '@luke-ui/react/text';
import type { CSSProperties } from 'react';
import { test } from 'vite-plus/test';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, Stack } from '../test-utils/visual.js';

const stackStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
} satisfies CSSProperties;

function EmojiScene() {
	return (
		<Stack>
			<div style={stackStyle}>
				<Text typography="display">
					Hello <Emoji emoji="👋" label="Waving hand display" />
				</Text>
				<Text typography="heading3">
					Hello <Emoji emoji="👋" label="Waving hand heading3" />
				</Text>
				<Text typography="body">
					Hello <Emoji emoji="👋" label="Waving hand body" />
				</Text>
				<Text typography="caption">
					Hello <Emoji emoji="👋" label="Waving hand caption" />
				</Text>
			</div>
		</Stack>
	);
}

test('the Emoji scene has no axe violations', async () => {
	const { container } = render(<EmojiScene />);

	await expectNoAxeViolations(container);
});

test('inherits surrounding typography', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<EmojiScene />, { appearance });
		await captureVisualAppearance(locator, 'emoji/inheritance', appearance);
	}
});
