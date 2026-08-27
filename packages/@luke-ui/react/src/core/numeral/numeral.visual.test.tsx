import type { CSSProperties } from 'react';
import { test } from 'vite-plus/test';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, Stack } from '../test-utils/visual.js';
import { Numeral } from './numeral.js';

const rowStyle = {
	display: 'flex',
	gap: '1.5rem',
} satisfies CSSProperties;

for (const appearance of visualAppearances) {
	test(`formats and typography: ${appearance.theme} ${appearance.mode}`, async () => {
		const { locator } = render(
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
						textAlign="end"
						typography="heading3"
						value={12_345.67}
					/>
				</div>
			</Stack>,
			{ appearance },
		);

		await captureVisualAppearance(locator, 'numeral/formats-typography', appearance);
	});
}
