import { expect, test } from 'vite-plus/test';
import {
	captureVisual,
	captureVisualAppearance,
	renderVisual,
	Stack,
	variantValuesFor,
	visualAppearances,
} from '../test-utils/render-visual.js';
import { Heading } from './index.js';

const levels = variantValuesFor<typeof Heading, 'level'>()([1, 2, 3, 4, 5, 6]);

test.each(visualAppearances)('levels: $theme $mode', async (appearance) => {
	const locator = renderVisual(
		<Stack width="40rem">
			{levels.map((level) => (
				<Heading key={level} level={level}>
					Level {level} heading
				</Heading>
			))}
			<Heading level={1} size={900}>
				Display heading
			</Heading>
		</Stack>,
		appearance,
	);
	await expect.element(locator).toBeVisible();

	await captureVisualAppearance(locator, 'heading/levels', appearance);
});

test('truncated heading', async () => {
	const locator = renderVisual(
		<Stack width="20rem">
			<Heading level={2} lineClamp={1}>
				A flat-file CMS stores content in files rather than a database.
			</Heading>
		</Stack>,
	);

	await captureVisual(locator, 'heading/truncated');
});
