import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import {
	captureVisual,
	captureVisualAppearance,
	renderVisual,
	Stack,
	visualAppearances,
} from '../test-utils/render-visual.js';
import { Text } from './index.js';

const rowStyle = {
	alignItems: 'baseline',
	display: 'flex',
	flexWrap: 'wrap',
	gap: '1rem',
} satisfies CSSProperties;

test.each(visualAppearances)('composite typography: $theme $mode', async (appearance) => {
	const locator = renderVisual(
		<Stack width="40rem">
			<div style={rowStyle}>
				<Text size={100}>100</Text>
				<Text size={200}>200</Text>
				<Text size={300}>300</Text>
				<Text size={400}>400</Text>
				<Text size={500}>500</Text>
				<Text size={600}>600</Text>
				<Text size={700}>700</Text>
				<Text size={800}>800</Text>
				<Text size={900}>900</Text>
			</div>
			<div style={rowStyle}>
				<Text fontWeight="body">Body</Text>
				<Text fontWeight="label">Label</Text>
				<Text fontWeight="heading">Heading</Text>
				<Text fontWeight="emphasis">Emphasis</Text>
			</div>
			<div style={rowStyle}>
				<Text color="primary">Primary</Text>
				<Text color="secondary">Secondary</Text>
				<Text color="accent">Accent</Text>
				<Text color="info">Info</Text>
				<Text color="success">Success</Text>
				<Text color="warning">Warning</Text>
				<Text color="danger">Danger</Text>
			</div>
			<Text>Trimmed by default</Text>
			<Text shouldDisableTrim>Trim disabled</Text>
		</Stack>,
		appearance,
	);
	await expect.element(locator).toBeVisible();

	await captureVisualAppearance(locator, 'text/composite-typography', appearance);
});

test('line clamp and transforms', async () => {
	const locator = renderVisual(
		<Stack width="18rem">
			<Text lineClamp={2}>
				A short paragraph of placeholder copy that wraps across multiple lines and then clamps.
			</Text>
			<Text textDecoration="underline" textTransform="uppercase">
				Decorated text
			</Text>
		</Stack>,
	);

	await captureVisual(locator, 'text/line-clamp-transforms');
});
