import type { CSSProperties } from 'react';
import { test } from 'vite-plus/test';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, Stack } from '../test-utils/visual.js';
import { Text } from '../text/index.js';
import { Emoji } from './index.js';

const stackStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
} satisfies CSSProperties;

for (const appearance of visualAppearances) {
	test(`inherits surrounding typography: ${appearance.theme} ${appearance.mode}`, async () => {
		const { locator } = render(
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
			</Stack>,
			{ appearance },
		);

		await captureVisualAppearance(locator, 'emoji/inheritance', appearance);
	});
}
