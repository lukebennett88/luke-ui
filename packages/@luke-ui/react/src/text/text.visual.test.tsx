import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import { renderVisual, Stack } from '../test-utils/render-visual.js';
import { Text } from './index.js';

const rowStyle = {
	alignItems: 'baseline',
	display: 'flex',
	gap: '1rem',
} satisfies CSSProperties;

test('typography variants', async () => {
	const locator = renderVisual(
		<Stack width="40rem">
			<div style={rowStyle}>
				<Text fontSize="small">Small text</Text>
				<Text fontSize="standard">Standard text</Text>
				<Text fontSize="large">Large text</Text>
			</div>
			<div style={rowStyle}>
				<Text fontWeight="regular">Regular</Text>
				<Text fontWeight="medium">Medium</Text>
				<Text fontWeight="bold">Bold</Text>
			</div>
			<div style={rowStyle}>
				<Text color="neutralSubtle">Subtle</Text>
				<Text color="informative">Informative</Text>
				<Text color="critical">Critical</Text>
			</div>
		</Stack>,
	);

	await expect.element(locator).toMatchScreenshot('text-typography-variants');
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

	await expect.element(locator).toMatchScreenshot('text-line-clamp-transforms');
});
