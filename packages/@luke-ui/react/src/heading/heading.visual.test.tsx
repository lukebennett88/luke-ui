import { test } from 'vite-plus/test';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	Stack,
	variantValuesFor,
} from '../test-utils/visual.js';
import { Heading } from './index.js';

const levels = variantValuesFor<typeof Heading, 'level'>()([1, 2, 3, 4, 5, 6]);

for (const appearance of visualAppearances) {
	test(`levels: ${appearance.theme} ${appearance.mode}`, async () => {
		const { locator } = render(
			<Stack width="40rem">
				{levels.map((level) => (
					<Heading key={level} level={level}>
						Level {level} heading
					</Heading>
				))}
				<Heading level={1} size="display">
					Display heading
				</Heading>
			</Stack>,
			{ appearance },
		);

		await captureVisualAppearance(locator, 'heading/levels', appearance);
	});
}

test('truncated heading', async () => {
	const { locator } = render(
		<Stack width="20rem">
			<Heading level={2} lineClamp={1}>
				A flat-file CMS stores content in files rather than a database.
			</Heading>
		</Stack>,
	);

	await captureVisual(locator, 'heading/truncated');
});
