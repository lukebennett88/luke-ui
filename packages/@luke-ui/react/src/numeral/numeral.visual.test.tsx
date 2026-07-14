import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import {
	captureVisualAppearance,
	renderVisual,
	Stack,
	visualAppearances,
} from '../test-utils/render-visual.js';
import { Numeral } from './index.js';

const rowStyle = {
	display: 'flex',
	gap: '1.5rem',
} satisfies CSSProperties;

test.each(visualAppearances)('formats and typography: $theme $mode', async (appearance) => {
	const locator = renderVisual(
		<Stack>
			<div style={rowStyle}>
				<Numeral value={120_000} />
				<Numeral abbreviate value={120_000} />
				<Numeral abbreviate="long" value={120_000} />
			</div>
			<div style={rowStyle}>
				<Numeral currency="AUD" precision={2} value={98.7654} />
				<Numeral format="percent" precision={1} value={0.982} />
				<Numeral unit="kilometer-per-hour" value={98} />
			</div>
			<div style={{ inlineSize: '10rem' } satisfies CSSProperties}>
				<Numeral
					color="accent"
					fontWeight="emphasis"
					size={600}
					textAlign="end"
					value={12_345.67}
				/>
			</div>
		</Stack>,
		appearance,
	);
	await expect.element(locator).toBeVisible();

	await captureVisualAppearance(locator, 'numeral/formats-typography', appearance);
});
