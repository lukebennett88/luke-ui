import { test } from 'vite-plus/test';
import {
	captureVisual,
	renderVisual,
	Stack,
	variantValuesFor,
} from '../test-utils/render-visual.js';
import { Heading } from './index.js';

const levels = variantValuesFor<typeof Heading, 'level'>()([1, 2, 3, 4, 5, 6]);

test('levels', async () => {
	const locator = renderVisual(
		<Stack width="40rem">
			{levels.map((level) => (
				<Heading key={level} level={level}>
					Level {level} heading
				</Heading>
			))}
		</Stack>,
	);

	await captureVisual(locator, 'heading/levels');
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
