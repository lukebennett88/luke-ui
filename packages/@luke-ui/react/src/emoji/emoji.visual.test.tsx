import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import {
	captureVisualAppearance,
	renderVisual,
	Stack,
	variantValuesFor,
	visualAppearances,
} from '../test-utils/render-visual.js';
import { Emoji } from './index.js';

const rowStyle = {
	alignItems: 'center',
	display: 'flex',
	gap: '1rem',
} satisfies CSSProperties;

const sizes = variantValuesFor<typeof Emoji, 'size'>()([100, 300, 500, 700, 900]);

test.each(visualAppearances)('sizes and colors: $theme $mode', async (appearance) => {
	const locator = renderVisual(
		<Stack>
			<div style={rowStyle}>
				{sizes.map((size) => (
					<Emoji emoji="🚀" key={size} label={`Rocket ${size}`} size={size} />
				))}
			</div>
			<div style={rowStyle}>
				<Emoji color="primary" emoji="✅" label="Done" />
				<Emoji color="info" emoji="💡" label="Idea" />
				<Emoji color="danger" emoji="⚠️" label="Warning" />
			</div>
		</Stack>,
		appearance,
	);
	await expect.element(locator).toBeVisible();

	await captureVisualAppearance(locator, 'emoji/sizes-colors', appearance);
});
