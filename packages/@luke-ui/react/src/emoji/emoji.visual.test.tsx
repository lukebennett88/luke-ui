import type { CSSProperties } from 'react';
import { test } from 'vite-plus/test';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, Stack, variantValuesFor } from '../test-utils/visual.js';
import { Emoji } from './index.js';

const rowStyle = {
	alignItems: 'center',
	display: 'flex',
	gap: '1rem',
} satisfies CSSProperties;

const typographyStyles = variantValuesFor<typeof Emoji, 'typography'>()([
	'caption',
	'body',
	'heading4',
	'heading2',
	'display',
]);

for (const appearance of visualAppearances) {
	test(`typography and colours: ${appearance.theme} ${appearance.mode}`, async () => {
		const { locator } = render(
			<Stack>
				<div style={rowStyle}>
					{typographyStyles.map((typography) => (
						<Emoji
							emoji="🚀"
							key={typography}
							label={`Rocket ${typography}`}
							typography={typography}
						/>
					))}
				</div>
				<div style={rowStyle}>
					<Emoji color="primary" emoji="✅" label="Done" />
					<Emoji color="info" emoji="💡" label="Idea" />
					<Emoji color="danger" emoji="⚠️" label="Warning" />
				</div>
			</Stack>,
			{ appearance },
		);

		await captureVisualAppearance(locator, 'emoji/sizes-colors', appearance);
	});
}
