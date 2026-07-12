import { test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import {
	captureVisual,
	focusViaKeyboard,
	Grid,
	renderVisual,
} from '../test-utils/render-visual.js';
import { IconButton } from './index.js';

test('sizes and states', async () => {
	const locator = renderVisual(
		<Grid columns={4}>
			<IconButton aria-label="Add small" icon="add" size="small" />
			<IconButton aria-label="Add medium" icon="add" size="medium" />
			<IconButton aria-label="Disabled small" icon="delete" isDisabled size="small" />
			<IconButton aria-label="Disabled medium" icon="delete" isDisabled size="medium" />
		</Grid>,
	);

	await captureVisual(locator, 'icon-button/sizes-states');
});

test('keyboard focus ring', async () => {
	const scene = renderVisual(
		<Grid columns={1}>
			<IconButton aria-label="Focus add" icon="add" />
		</Grid>,
	);

	await focusViaKeyboard(page.getByRole('button', { name: 'Focus add' }));
	await captureVisual(scene, 'icon-button/focus-visible');
});
