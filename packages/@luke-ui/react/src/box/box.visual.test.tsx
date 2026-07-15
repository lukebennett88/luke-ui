import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import {
	captureVisualAppearance,
	renderVisual,
	visualAppearances,
} from '../test-utils/render-visual.js';
import { vars } from '../theme/index.js';
import { Box } from './index.js';

test.each(visualAppearances)('layout: $theme $mode', async (appearance) => {
	const scene = renderVisual(
		<Box
			display="flex"
			flexDirection="column"
			gap="200"
			padding="400"
			style={{
				backgroundColor: vars.color.surface.recessed,
				borderRadius: vars.radius.surface,
				boxShadow: vars.depth.recessed,
				color: vars.color.text.primary,
			}}
		>
			<Box>Account</Box>
			<Box display="flex" gap="200">
				<Box>Profile</Box>
				<Box>Security</Box>
			</Box>
		</Box>,
		appearance,
	);
	const layout = page.getByText('Account').element().parentElement;
	if (layout == null) throw new Error('Expected the Box layout container.');

	await expect
		.element(page.elementLocator(layout))
		.toHaveStyle({ display: 'flex', flexDirection: 'column' });
	await captureVisualAppearance(scene, 'box/layout', appearance);
});
