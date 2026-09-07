import { test } from 'vite-plus/test';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisual, captureVisualAppearance, Stack } from '../test-utils/visual.js';
import { Text } from '../text/text.js';
import { Code } from './code.js';

const LONG_CONTENT =
	'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen';

for (const appearance of visualAppearances) {
	test(`kitchen sink: ${appearance.theme} ${appearance.mode}`, async () => {
		const { locator } = render(
			<Stack width="20rem">
				<Text>
					Run <Code>npm install</Code> to install dependencies.
				</Text>
				<Text typography="lead">
					The <Code>useTheme</Code> hook tracks the active theme.
				</Text>
				<Text typography="caption">
					Set <Code>data-color-mode</Code> on the root element.
				</Text>
			</Stack>,
			{ appearance },
		);

		await captureVisualAppearance(locator, 'code/kitchen-sink', appearance);
	});
}

test('long content states', async () => {
	const { locator } = render(
		<Stack width="10rem">
			<Code lineClamp>{LONG_CONTENT}</Code>
			<Code lineClamp={3}>{LONG_CONTENT}</Code>
		</Stack>,
	);

	await captureVisual(locator, 'code/long-content');
});
