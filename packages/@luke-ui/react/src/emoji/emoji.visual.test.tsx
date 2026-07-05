import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import { renderVisual, Stack, variantValuesFor } from '../test-utils/render-visual.js';
import { Emoji } from './index.js';

const rowStyle = {
	alignItems: 'center',
	display: 'flex',
	gap: '1rem',
} satisfies CSSProperties;

const fontSizes = variantValuesFor<typeof Emoji, 'fontSize'>()(['small', 'standard', 'large']);

test('sizes and colors', async () => {
	const locator = renderVisual(
		<Stack>
			<div style={rowStyle}>
				{fontSizes.map((fontSize) => (
					<Emoji emoji="🚀" fontSize={fontSize} key={fontSize} label={`Rocket ${fontSize}`} />
				))}
			</div>
			<div style={rowStyle}>
				<Emoji color="neutralBold" emoji="✅" label="Done" />
				<Emoji color="informative" emoji="💡" label="Idea" />
				<Emoji color="critical" emoji="⚠️" label="Warning" />
			</div>
		</Stack>,
	);

	await expect.element(locator).toMatchScreenshot('emoji-sizes-colors');
});
