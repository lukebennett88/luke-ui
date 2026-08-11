import type { CSSProperties } from 'react';
import { test } from 'vite-plus/test';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisual, captureVisualAppearance, Stack } from '../test-utils/visual.js';
import { Text } from './index.js';

const rowStyle = {
	alignItems: 'baseline',
	display: 'flex',
	flexWrap: 'wrap',
	gap: '1rem',
} satisfies CSSProperties;

for (const appearance of visualAppearances) {
	test(`type scale: ${appearance.theme} ${appearance.mode}`, async () => {
		const { locator } = render(
			<Stack width="40rem">
				<div style={rowStyle}>
					<Text size="caption">caption</Text>
					<Text size="label">label</Text>
					<Text size="body">body</Text>
					<Text size="lead">lead</Text>
					<Text size="heading4">heading4</Text>
					<Text size="heading3">heading3</Text>
					<Text size="heading2">heading2</Text>
					<Text size="heading1">heading1</Text>
					<Text size="display">display</Text>
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
			{ appearance },
		);

		await captureVisualAppearance(locator, 'text/type-scale', appearance);
	});
}

test('line clamp and transforms', async () => {
	const { locator } = render(
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
